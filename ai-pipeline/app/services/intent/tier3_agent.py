"""Tier 3: bounded, tool-scoped agent for compound requests.

Only reached when tier 2 sets requires_multi_step. This is deliberately
the slow, expensive path, so it is capped hard on both step count and
wall clock time. If it doesn't converge in budget, the caller should
fall back to the best single-shot tier 2 result rather than hang.

Tools are whitelisted on purpose. The agent can only call the specific
backend functions registered below, it never gets a raw "do anything"
capability. Actual tool implementations are stubs for now, they should
be wired up to the Node monolith's internal API once those endpoints
exist (see docs/api_contract.md).
"""

import asyncio
import logging
from collections.abc import Awaitable, Callable

from app.config import get_settings

logger = logging.getLogger("ai_pipeline.intent.tier3")
settings = get_settings()

ToolFn = Callable[..., Awaitable[dict]]


class AgentTimeoutError(Exception):
    pass


class AgentStepLimitError(Exception):
    pass


# Whitelisted tools only. Add new ones here deliberately, never let the
# agent construct or call anything not registered in this dict.
_TOOL_REGISTRY: dict[str, ToolFn] = {}


def register_tool(name: str):
    def decorator(fn: ToolFn) -> ToolFn:
        _TOOL_REGISTRY[name] = fn
        return fn
    return decorator


@register_tool("search_listings")
async def _search_listings_stub(**kwargs) -> dict:
    # TODO: call the Node monolith's internal search endpoint once it exists.
    logger.info("search_listings tool called with %s (stub)", kwargs)
    return {"results": [], "note": "stub, not yet wired to the backend"}


@register_tool("contact_seller")
async def _contact_seller_stub(**kwargs) -> dict:
    # TODO: call the Node monolith's messaging endpoint once it exists.
    logger.info("contact_seller tool called with %s (stub)", kwargs)
    return {"sent": False, "note": "stub, not yet wired to the backend"}


async def run_agent(text: str, entities: list[dict]) -> dict:
    """
    Placeholder bounded loop. Real planning logic (deciding which tool to
    call, in what order, based on the LLM's plan) goes here once tier 2's
    entity extraction is solid enough to hand off reliably. For now this
    enforces the step cap and timeout contract so the router and its
    callers can already depend on that behavior.
    """
    steps_taken = 0

    async def _bounded_run():
        nonlocal steps_taken
        # Real implementation: loop over an LLM plan, calling _TOOL_REGISTRY
        # entries, incrementing steps_taken, and stopping at agent_max_steps.
        steps_taken += 1
        if steps_taken > settings.agent_max_steps:
            raise AgentStepLimitError(f"Exceeded {settings.agent_max_steps} steps")
        return {
            "intent": "compound_request",
            "entities": entities,
            "confidence": 0.5,
            "tier": "agent",
            "steps_taken": steps_taken,
            "note": "tier 3 planning logic not yet implemented, see TODOs",
        }

    try:
        return await asyncio.wait_for(_bounded_run(), timeout=settings.agent_timeout_seconds)
    except asyncio.TimeoutError as exc:
        raise AgentTimeoutError(
            f"Agent did not converge within {settings.agent_timeout_seconds}s"
        ) from exc
