"""Cheap language detection for the two languages we actually support.

Urdu written in its own script is trivially distinguishable from English
by Unicode range, so we don't pay for a detection API call at all. The
one case this can't catch is Roman Urdu (Urdu typed in Latin letters),
which reads as English text. We deliberately don't try to guess that
case here, the caller should fall back to the user's saved
preferred_language instead of trusting a detector on ambiguous text.
"""

import re

_URDU_RANGE = re.compile(r"[؀-ۿݐ-ݿ]")


def detect_language(text: str) -> str:
    """Returns 'ur' if the text contains Urdu script characters, else 'en'."""
    return "ur" if _URDU_RANGE.search(text) else "en"


def looks_like_roman_urdu(text: str) -> bool:
    """
    Best-effort heuristic flag, not a real classifier. Used only to decide
    whether to double check against the user's saved language preference
    rather than trusting detect_language's 'en' result outright.
    """
    roman_urdu_markers = {
        "hai", "hain", "nahi", "kya", "kyun", "aap", "acha", "theek",
        "kitna", "chahiye", "bhai", "yaar", "paisa", "paise",
    }
    words = set(re.findall(r"[a-zA-Z]+", text.lower()))
    return len(words & roman_urdu_markers) >= 1
