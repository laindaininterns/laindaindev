"""Tier 3: bounded, tool-scoped agent for compound requests.

Only reached when tier 2 sets requires_multi_step. This is deliberately
the slow, expensive path, so it is capped hard on both step count and
wall clock time. If it doesn't converge in budget, the router falls back
to the tier 2 result rather than let this hang or fail the request.

The loop is a plain ReAct pattern: at each turn the model either calls
one whitelisted tool or finishes with an answer, always as strict JSON,
never freeform text. Tools are whitelisted on purpose, the agent can
only call the specific functions registered below, it never gets a raw
"do anything" capability.

Actual tool implementations are stubs for now, they should be wired up
to the Node monolith's internal API once those endpoints exist (see
docs/api_contract.md).
"""

import asyncio
import json
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from app.config import get_settings
from app.models.schemas import IntentEntity
from app.services.intent.llm_client import LLMError, chat_json

logger = logging.getLogger("ai_pipeline.intent.tier3")
settings = get_settings()

ToolFn = Callable[..., Awaitable[dict]]


class AgentError(Exception):
    """Base class. The router catches this and falls back to the tier 2 result."""


class AgentTimeoutError(AgentError):
    pass


class AgentStepLimitError(AgentError):
    pass


@dataclass
class ToolSpec:
    name: str
    description: str
    parameters: dict  # {"param_name": "what it means"}, kept simple on purpose
    fn: ToolFn


# Whitelisted tools only. Add new ones here deliberately, with a real
# description, never let the agent construct or call anything not
# registered in this dict.
_TOOL_REGISTRY: dict[str, ToolSpec] = {}


def register_tool(name: str, description: str, parameters: dict):
    def decorator(fn: ToolFn) -> ToolFn:
        _TOOL_REGISTRY[name] = ToolSpec(name=name, description=description, parameters=parameters, fn=fn)
        return fn

    return decorator


@register_tool(
    "search_listings",
    "Search marketplace listings by keyword and an optional maximum price.",
    {"query": "keywords to search for", "max_price": "optional upper price limit, a number"},
)
async def _search_listings_stub(**kwargs) -> dict:
    # TODO: call the Node monolith's internal search endpoint once it exists.
    logger.info("search_listings tool called with %s (stub)", kwargs)
    return {"results": [], "note": "stub, not yet wired to the backend"}


@register_tool(
    "contact_seller",
    "Send a message to a specific seller about a specific listing.",
    {"seller_id": "the seller to contact", "message": "the message text to send"},
)
async def _contact_seller_stub(**kwargs) -> dict:
    # TODO: call the Node monolith's messaging endpoint once it exists.
    logger.info("contact_seller tool called with %s (stub)", kwargs)
    return {"sent": False, "note": "stub, not yet wired to the backend"}


def _build_system_prompt() -> str:
    tool_lines = []
    for tool in _TOOL_REGISTRY.values():
        params = ", ".join(f"{name} ({meaning})" for name, meaning in tool.parameters.items())
        tool_lines.append(f"- {tool.name}({params}): {tool.description}")
    tools_block = "\n".join(tool_lines)

    return f"""You are a planning agent for a marketplace assistant, handling a
request that genuinely needs more than one step to satisfy. You can call
these tools:

{tools_block}

At each turn, respond with ONLY a JSON object, no other text, in one of two shapes.

To call a tool:
{{"thought": "why", "action": "<tool name>", "action_input": {{...}}}}

To finish and answer:
{{"thought": "why", "action": "finish", "intent": "compound_request",
 "entities": [{{"name": "...", "value": "..."}}], "confidence": 0.0 to 1.0}}

Only call a tool from the list above, with only the parameters it defines.
Finish as soon as you have enough information, do not call tools you don't need.
"""


async def _decide_next_step(user_request: str, trace: list[dict]) -> dict:
    trace_text = json.dumps(trace, ensure_ascii=False) if trace else "no steps taken yet"
    user_content = f"Original request: {user_request}\n\nSteps so far: {trace_text}\n\nWhat is the next step?"
    return await chat_json(_build_system_prompt(), [{"role": "user", "content": user_content}])


async def _bounded_run(text: str, entities: list[dict]) -> dict:
    trace: list[dict] = (
        [{"observation": f"entities already extracted from the original message: {entities}"}] if entities else []
    )

    for step_number in range(1, settings.agent_max_steps + 1):
        try:
            decision = await _decide_next_step(text, trace)
        except LLMError as exc:
            raise AgentError(f"Agent LLM call failed at step {step_number}: {exc}") from exc

        action = decision.get("action")

        if action == "finish":
            return {
                "intent": decision.get("intent", "compound_request"),
                "entities": [IntentEntity(**e) for e in decision.get("entities", [])],
                "confidence": float(decision.get("confidence", 0.5)),
                "tier": "agent",
                "steps_taken": step_number,
            }

        tool = _TOOL_REGISTRY.get(action)
        if tool is None:
            trace.append({"action": action, "observation": f"error: '{action}' is not a registered tool"})
            continue

        action_input = decision.get("action_input", {})
        try:
            observation = await tool.fn(**action_input)
        except Exception as exc:  # noqa: BLE001, a broken tool call is a step outcome to reason about, not a crash
            observation = {"error": str(exc)}

        trace.append({"action": action, "action_input": action_input, "observation": observation})

    raise AgentStepLimitError(f"Did not finish within {settings.agent_max_steps} steps")


async def run_agent(text: str, entities: list[dict]) -> dict:
    """
    Runs the bounded loop: propose a tool call or finish, execute it,
    feed the result back, repeat up to agent_max_steps, all within
    agent_timeout_seconds. Callers should catch AgentError and fall back
    to the tier 2 result rather than fail the whole request.
    """
    try:
        return await asyncio.wait_for(_bounded_run(text, entities), timeout=settings.agent_timeout_seconds)
    except asyncio.TimeoutError as exc:
        raise AgentTimeoutError(f"Agent did not converge within {settings.agent_timeout_seconds}s") from exc
