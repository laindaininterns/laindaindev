"""Request and response shapes for the service's public API.

These are the contract the Node monolith codes against. Changing a field
here is a breaking change for the other team, bump the API version in
docs/api_contract.md if you do.
"""

from typing import Literal

from pydantic import BaseModel, Field

Language = Literal["en", "ur"]


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    source_lang: Language | None = None  # if omitted, we detect it
    target_lang: Language


class TranslateResponse(BaseModel):
    translated_text: str
    source_lang: Language
    target_lang: Language
    provider: str  # "azure" | "libretranslate" | "cache"
    cached: bool


class TranscribeResponse(BaseModel):
    transcript_original: str
    transcript_english: str
    detected_lang: Language
    duration_seconds: float


class IntentEntity(BaseModel):
    name: str
    value: str


class ParseIntentRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


class ParseIntentResponse(BaseModel):
    intent: str
    entities: list[IntentEntity]
    confidence: float
    tier: Literal["rules", "llm", "agent"]
    requires_confirmation: bool
