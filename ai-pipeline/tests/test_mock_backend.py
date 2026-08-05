"""Tests for mock_backend itself, the fixture data and its filtering logic.

This proves the mock backend behaves the way docs/api_contract.md says
it should, independent of the agent. tests/test_tier3_tools.py then
proves the agent's tools call it correctly and parse what comes back.
Together these two are what "properly tested despite no real users"
actually looks like, see the reasoning in api_contract.md.
"""

from fastapi.testclient import TestClient

from mock_backend.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_search_by_keyword():
    response = client.post("/internal/search-listings", json={"query": "bike"})
    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) >= 3  # mountain bike, city bike, kids bike are all category "bike"
    assert all("bike" in r["title"].lower() or r["category"] == "bike" for r in results)


def test_search_respects_max_price():
    response = client.post("/internal/search-listings", json={"query": "bike", "max_price": 15000})
    results = response.json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == "L4"  # the only bike under 15000 in the fixture data
    assert all(r["price"] <= 15000 for r in results)


def test_search_with_no_matches_returns_empty_list_not_error():
    response = client.post("/internal/search-listings", json={"query": "spaceship"})
    assert response.status_code == 200
    assert response.json()["results"] == []


def test_contact_known_seller_succeeds():
    response = client.post("/internal/contact-seller", json={"seller_id": "S1", "message": "still available?"})
    assert response.status_code == 200
    body = response.json()
    assert body["sent"] is True
    assert body["message_id"]
    assert body["error"] is None


def test_contact_unknown_seller_fails_cleanly():
    response = client.post("/internal/contact-seller", json={"seller_id": "does-not-exist", "message": "hello"})
    assert response.status_code == 200  # not a transport error, a normal failed-outcome response
    body = response.json()
    assert body["sent"] is False
    assert "unknown seller_id" in body["error"]
