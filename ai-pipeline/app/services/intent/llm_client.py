"""Shared client for talking to the tier 2 and tier 3 language model.

Both tiers hit the same OpenAI-compatible chat completions endpoint (a
self-hosted Ollama model by default, see INTENT_LLM_* in .env.example),
they just use different prompts and different numbers of turns. Keeping
the actual HTTP call in one place means a provider change or a retry
policy change only has to happen once.
"""

import json
import logging

import httpx

from app.config import get_settings

logger = logging.getLogger("ai_pipeline.intent.llm_client")
settings = get_settings()


class LLMError(Exception):
    pass


async def chat_json(system_prompt: str, messages: list[dict]) -> dict:
    """
    Sends a system prompt plus a conversation history and expects a JSON
    object back. Raises LLMError on a transport failure or invalid JSON,
    callers decide what the right fallback behavior is for their tier.
    """
    payload = {
        "model": settings.intent_llm_model,
        "messages": [{"role": "system", "content": system_prompt}, *messages],
        "temperature": 0,
        "response_format": {"type": "json_object"},
    }
    headers = {"Content-Type": "application/json"}
    if settings.intent_llm_api_key:
        headers["Authorization"] = f"Bearer {settings.intent_llm_api_key}"

    url = f"{settings.intent_llm_base_url}/chat/completions"

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            raw = response.json()["choices"][0]["message"]["content"]
    except (httpx.HTTPError, KeyError, IndexError) as exc:
        raise LLMError(f"LLM call failed: {exc}") from exc

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise LLMError(f"LLM returned non JSON output: {raw!r}") from exc
