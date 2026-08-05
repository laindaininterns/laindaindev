"""Tier 2: single-shot LLM intent and entity extraction.

Only reached when tier 1 rules don't confidently match. Uses the shared
LLM client, pointed at any OpenAI-compatible endpoint, so this can run
against a free self-hosted Ollama model without changing this code, just
the INTENT_LLM_* env vars.

The prompt forces strict JSON output, including a requires_multi_step
flag, that flag is the gate the router uses to decide whether to escalate
further to the tier 3 agent. Most requests should never reach tier 3.
"""

import logging

from app.models.schemas import IntentEntity
from app.services.intent.llm_client import LLMError, chat_json

logger = logging.getLogger("ai_pipeline.intent.tier2")

_SYSTEM_PROMPT = """You are an intent classifier for a marketplace chat assistant.
Given a user message in English, respond with ONLY a JSON object, no other text:

{
  "intent": "search_listing" | "order_status" | "create_listing" | "negotiate_price" | "complaint" | "other",
  "entities": [{"name": "...", "value": "..."}],
  "confidence": 0.0 to 1.0,
  "requires_multi_step": true or false
}

Set requires_multi_step to true only if the request genuinely needs more
than one backend action to satisfy, for example a search plus a fallback
search plus contacting multiple sellers. A single search or a single
status lookup is not multi step.
"""

_FALLBACK_RESULT = {"intent": "other", "entities": [], "confidence": 0.3, "requires_multi_step": False}


async def classify(text: str) -> dict:
    try:
        parsed = await chat_json(_SYSTEM_PROMPT, [{"role": "user", "content": text}])
    except LLMError as exc:
        logger.warning("Tier 2 LLM call failed, falling back to 'other': %s", exc)
        parsed = _FALLBACK_RESULT

    return {
        "intent": parsed.get("intent", "other"),
        "entities": [IntentEntity(**e) for e in parsed.get("entities", [])],
        "confidence": float(parsed.get("confidence", 0.3)),
        "requires_multi_step": bool(parsed.get("requires_multi_step", False)),
        "tier": "llm",
    }
