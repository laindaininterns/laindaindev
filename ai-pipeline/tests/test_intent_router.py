from unittest.mock import AsyncMock, patch

import pytest

from app.models.schemas import IntentEntity
from app.services.intent import router
from app.services.intent.tier3_agent import AgentStepLimitError


@pytest.mark.asyncio
async def test_confident_rule_match_skips_llm_entirely():
    with patch("app.services.intent.router.tier2_llm.classify", new=AsyncMock()) as mock_classify:
        result = await router.resolve_intent("find me a bike under 20000")

    mock_classify.assert_not_called()
    assert result["intent"] == "search_listing"
    assert result["requires_confirmation"] is False


@pytest.mark.asyncio
async def test_falls_through_to_tier2_when_rules_dont_match():
    tier2_result = {
        "intent": "other",
        "entities": [],
        "confidence": 0.9,
        "requires_multi_step": False,
        "tier": "llm",
    }
    with patch("app.services.intent.router.tier2_llm.classify", new=AsyncMock(return_value=tier2_result)):
        result = await router.resolve_intent("something ambiguous")

    assert result["tier"] == "llm"
    assert result["requires_confirmation"] is False


@pytest.mark.asyncio
async def test_low_confidence_result_requires_confirmation():
    tier2_result = {
        "intent": "other",
        "entities": [],
        "confidence": 0.2,
        "requires_multi_step": False,
        "tier": "llm",
    }
    with patch("app.services.intent.router.tier2_llm.classify", new=AsyncMock(return_value=tier2_result)):
        result = await router.resolve_intent("mumble mumble")

    assert result["requires_confirmation"] is True


@pytest.mark.asyncio
async def test_escalates_to_agent_when_tier2_flags_multi_step():
    tier2_result = {
        "intent": "other",
        "entities": [IntentEntity(name="query", value="bike")],
        "confidence": 0.7,
        "requires_multi_step": True,
        "tier": "llm",
    }
    agent_result = {
        "intent": "compound_request",
        "entities": [],
        "confidence": 0.8,
        "tier": "agent",
        "steps_taken": 2,
    }
    with (
        patch("app.services.intent.router.tier2_llm.classify", new=AsyncMock(return_value=tier2_result)),
        patch("app.services.intent.router.tier3_agent.run_agent", new=AsyncMock(return_value=agent_result)),
    ):
        # Deliberately avoids tier 1's keyword list (find, looking for, need,
        # search, show me, ...) so this actually exercises the tier 2 to
        # tier 3 escalation path instead of short-circuiting at tier 1.
        result = await router.resolve_intent("get bikes matching my budget and reach out to their owners for me")

    assert result["tier"] == "agent"


@pytest.mark.asyncio
async def test_falls_back_to_tier2_result_when_agent_fails():
    tier2_result = {
        "intent": "other",
        "entities": [],
        "confidence": 0.7,
        "requires_multi_step": True,
        "tier": "llm",
    }
    with (
        patch("app.services.intent.router.tier2_llm.classify", new=AsyncMock(return_value=tier2_result)),
        patch(
            "app.services.intent.router.tier3_agent.run_agent",
            new=AsyncMock(side_effect=AgentStepLimitError("never finished")),
        ),
    ):
        result = await router.resolve_intent("a genuinely compound request")

    assert result["tier"] == "llm"
