from app.services.intent import tier1_rules


def test_matches_search_intent():
    result = tier1_rules.match("find me a bike under 20000")
    assert result is not None
    assert result["intent"] == "search_listing"


def test_extracts_price_entity():
    result = tier1_rules.match("show me bikes under 20000")
    prices = [e.value for e in result["entities"] if e.name == "price_limit"]
    assert prices == ["20000"]


def test_matches_order_status_intent():
    result = tier1_rules.match("where is my order")
    assert result["intent"] == "order_status"


def test_no_match_returns_none():
    assert tier1_rules.match("hello there, nice weather today") is None
