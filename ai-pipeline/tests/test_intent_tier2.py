from unittest.mock import AsyncMock, patch

import pytest

from app.services.intent import tier2_llm
from app.services.intent.llm_client import LLMError


@pytest.mark.asyncio
async def test_classifies_using_llm_response():
    llm_response = {
        "intent": "search_listing",
        "entities": [{"name": "query", "value": "bike"}],
        "confidence": 0.9,
        "requires_multi_step": False,
    }
    with patch("app.services.intent.tier2_llm.chat_json", new=AsyncMock(return_value=llm_response)):
        result = await tier2_llm.classify("find me a bike")

    assert result["intent"] == "search_listing"
    assert result["entities"][0].value == "bike"
    assert result["requires_multi_step"] is False


@pytest.mark.asyncio
async def test_falls_back_to_other_when_llm_call_fails():
    with patch("app.services.intent.tier2_llm.chat_json", new=AsyncMock(side_effect=LLMError("unreachable"))):
        result = await tier2_llm.classify("anything")

    assert result["intent"] == "other"
    assert result["confidence"] == 0.3
