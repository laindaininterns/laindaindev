"""Tests that the agent's tool functions call the backend contract
correctly and parse what comes back, using httpx's ASGITransport to
route requests straight into the real mock_backend app in-process, no
Docker or network socket needed. This is the strongest test possible
without an actual running stack: real request, real routing, real
fixture data, real response parsing, just not over a real socket.
"""

import pytest

from app.services.intent import tier3_agent

# route_to_mock_backend comes from tests/conftest.py


@pytest.mark.asyncio
async def test_search_listings_tool_returns_real_fixture_data(route_to_mock_backend):
    result = await tier3_agent._search_listings(query="bike", max_price=15000)
    assert result["results"] == [
        {"id": "L4", "title": "Kids bicycle, 16 inch wheels", "category": "bike", "price": 9000, "seller_id": "S3"}
    ]


@pytest.mark.asyncio
async def test_search_listings_tool_handles_no_matches(route_to_mock_backend):
    result = await tier3_agent._search_listings(query="spaceship")
    assert result["results"] == []


@pytest.mark.asyncio
async def test_contact_seller_tool_succeeds_for_known_seller(route_to_mock_backend):
    result = await tier3_agent._contact_seller(seller_id="S1", message="is this available?")
    assert result["sent"] is True
    assert result["message_id"]


@pytest.mark.asyncio
async def test_contact_seller_tool_reports_unknown_seller(route_to_mock_backend):
    result = await tier3_agent._contact_seller(seller_id="ghost", message="hello?")
    assert result["sent"] is False
    assert "unknown seller_id" in result["error"]
