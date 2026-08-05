"""Tier 1: deterministic rule based intent matching.

Handles the small set of intents that make up most real marketplace
traffic, in well under a millisecond, with no model call at all. Returns
None when nothing matches confidently, the router then escalates to
tier 2. Keep this list small and specific, it should never guess.
"""

import re

from app.models.schemas import IntentEntity

_PRICE_PATTERN = re.compile(r"(?:rs\.?|pkr)?\s?(\d{2,7})", re.IGNORECASE)

_RULES: list[tuple[str, re.Pattern, float]] = [
    ("search_listing", re.compile(r"\b(find|looking for|need|search|show me)\b", re.IGNORECASE), 0.9),
    ("order_status", re.compile(r"\b(where is my order|track|order status|tracking number)\b", re.IGNORECASE), 0.92),
    ("create_listing", re.compile(r"\b(list this|sell my|add a listing|post an ad)\b", re.IGNORECASE), 0.88),
    ("negotiate_price", re.compile(r"\b(final price|best price|lowest price|discount)\b", re.IGNORECASE), 0.85),
    ("complaint", re.compile(r"\b(refund|complaint|not working|damaged|wrong item)\b", re.IGNORECASE), 0.85),
]


def match(text: str) -> dict | None:
    for intent, pattern, confidence in _RULES:
        if pattern.search(text):
            entities = _extract_entities(text)
            return {
                "intent": intent,
                "entities": entities,
                "confidence": confidence,
                "tier": "rules",
            }
    return None


def _extract_entities(text: str) -> list[IntentEntity]:
    entities = []
    price_match = _PRICE_PATTERN.search(text)
    if price_match:
        entities.append(IntentEntity(name="price_limit", value=price_match.group(1)))
    return entities
