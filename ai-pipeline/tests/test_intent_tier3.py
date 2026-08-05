from unittest.mock import AsyncMock, patch

import pytest

from app.services.intent import tier3_agent
from app.services.intent.llm_client import LLMError


@pytest.mark.asyncio
async def test_finishes_immediately_when_llm_has_enough_info():
    finish_decision = {
        "thought": "no tool needed",
        "action": "finish",
        "intent": "compound_request",
        "entities": [{"name": "price_limit", "value": "20000"}],
        "confidence": 0.8,
    }
    with patch("app.services.intent.tier3_agent.chat_json", new=AsyncMock(return_value=finish_decision)):
        result = await tier3_agent.run_agent("find a bike under 20000 or a scooter", [])

    assert result["tier"] == "agent"
    assert result["steps_taken"] == 1
    assert result["entities"][0].value == "20000"


@pytest.mark.asyncio
async def test_calls_a_tool_then_finishes():
    tool_call = {"thought": "search first", "action": "search_listings", "action_input": {"query": "bike"}}
    finish = {"thought": "done", "action": "finish", "intent": "compound_request", "entities": [], "confidence": 0.7}

    with patch(
        "app.services.intent.tier3_agent.chat_json",
        new=AsyncMock(side_effect=[tool_call, finish]),
    ):
        result = await tier3_agent.run_agent("find a bike, then message the seller", [])

    assert result["steps_taken"] == 2


@pytest.mark.asyncio
async def test_raises_step_limit_error_when_never_finishing():
    keep_going = {"thought": "still searching", "action": "search_listings", "action_input": {"query": "bike"}}
    with (
        patch("app.services.intent.tier3_agent.chat_json", new=AsyncMock(return_value=keep_going)),
        pytest.raises(tier3_agent.AgentStepLimitError),
    ):
        await tier3_agent.run_agent("an endlessly vague request", [])


@pytest.mark.asyncio
async def test_unknown_tool_name_is_recorded_and_loop_continues():
    bad_action = {"thought": "oops", "action": "delete_everything", "action_input": {}}
    finish = {"thought": "done", "action": "finish", "intent": "compound_request", "entities": [], "confidence": 0.6}

    with patch(
        "app.services.intent.tier3_agent.chat_json",
        new=AsyncMock(side_effect=[bad_action, finish]),
    ):
        result = await tier3_agent.run_agent("do something", [])

    assert result["steps_taken"] == 2


@pytest.mark.asyncio
async def test_llm_failure_raises_agent_error():
    with (
        patch("app.services.intent.tier3_agent.chat_json", new=AsyncMock(side_effect=LLMError("down"))),
        pytest.raises(tier3_agent.AgentError),
    ):
        await tier3_agent.run_agent("find a bike", [])
