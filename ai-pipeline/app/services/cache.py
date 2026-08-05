"""Translation memory cache, backed by Redis.

Marketplace chat repeats the same phrases constantly (prices, "available?",
"brand new", common product terms). Checking this cache before calling any
translation provider is what keeps real API/compute usage far under the
free tier limits as traffic grows.

Redis is treated as best effort, not a hard dependency. If it's
unreachable (down, not deployed yet, or simply not run locally), a
cache lookup is just a miss and a cache write is a silent no-op, not a
failure. Losing the cache means paying for a few more translation calls,
it should never mean the translation itself fails, that would make an
optimization into an outage.
"""

import hashlib
import logging

import redis.asyncio as redis

from app.config import get_settings

logger = logging.getLogger("ai_pipeline.cache")
settings = get_settings()

# Short timeouts so a Redis that's down or unreachable fails fast instead
# of stalling every translation request while it retries a connection.
_redis = redis.from_url(
    settings.redis_url,
    decode_responses=True,
    socket_connect_timeout=1.0,
    socket_timeout=1.0,
)


def _cache_key(text: str, target_lang: str) -> str:
    digest = hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()
    return f"translation:{target_lang}:{digest}"


async def get_cached_translation(text: str, target_lang: str) -> str | None:
    try:
        return await _redis.get(_cache_key(text, target_lang))
    except redis.RedisError as exc:
        logger.warning("Translation cache unavailable, treating as a miss: %s", exc)
        return None


async def set_cached_translation(text: str, target_lang: str, translated_text: str) -> None:
    try:
        await _redis.set(
            _cache_key(text, target_lang),
            translated_text,
            ex=settings.translation_cache_ttl_seconds,
        )
    except redis.RedisError as exc:
        logger.warning("Translation cache unavailable, skipping write: %s", exc)
