"""Tier 2: single-shot LLM intent and entity extraction.

Only reached when tier 1 rules don't confidently match. Talks to any
OpenAI-compatible chat completions endpoint, which is what lets this
point at a free self-hosted Ollama model without changing this code,
just the INTENT_LLM_* env vars.

The prompt forces strict JSON output, including a requires_multi_step
flag, that flag is the gate the router uses to decide whether to escalate
further to the tier 3 agent. Most requests should never reach tier 3.
"""

import json
import logging

import httpx

from app.config import get_settings
from app.models.schemas import IntentEntity

logger = logging.getLogger("ai_pipeline.intent.tier2")
settings = get_settings()

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


async def classify(text: str) -> dict:
    payload = {
        "model": settings.intent_llm_model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
        "temperature": 0,
        "response_format": {"type": "json_object"},
    }
    headers = {"Content-Type": "application/json"}
    if settings.intent_llm_api_key:
        headers["Authorization"] = f"Bearer {settings.intent_llm_api_key}"

    url = f"{settings.intent_llm_base_url}/chat/completions"

    async with httpx.AsyncClient(timeout=6.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        raw = response.json()["choices"][0]["message"]["content"]

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("Tier 2 returned non JSON output, falling back to 'other': %r", raw)
        parsed = {"intent": "other", "entities": [], "confidence": 0.3, "requires_multi_step": False}

    return {
        "intent": parsed.get("intent", "other"),
        "entities": [IntentEntity(**e) for e in parsed.get("entities", [])],
        "confidence": float(parsed.get("confidence", 0.3)),
        "requires_multi_step": bool(parsed.get("requires_multi_step", False)),
        "tier": "llm",
    }
