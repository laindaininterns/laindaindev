"""Translation memory cache, backed by Redis.

Marketplace chat repeats the same phrases constantly (prices, "available?",
"brand new", common product terms). Checking this cache before calling any
translation provider is what keeps real API/compute usage far under the
free tier limits as traffic grows.
"""

import hashlib

import redis.asyncio as redis

from app.config import get_settings

settings = get_settings()
_redis = redis.from_url(settings.redis_url, decode_responses=True)


def _cache_key(text: str, target_lang: str) -> str:
    digest = hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()
    return f"translation:{target_lang}:{digest}"


async def get_cached_translation(text: str, target_lang: str) -> str | None:
    return await _redis.get(_cache_key(text, target_lang))


async def set_cached_translation(text: str, target_lang: str, translated_text: str) -> None:
    await _redis.set(
        _cache_key(text, target_lang),
        translated_text,
        ex=settings.translation_cache_ttl_seconds,
    )
