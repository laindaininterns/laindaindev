"""Redis is best effort here, these prove the cache degrades to a no-op
instead of raising when Redis is unreachable, see the reasoning in
app/services/cache.py. This matters for anyone running the service
without Redis at all (no Docker, testing locally), translation should
still work, just uncached.
"""

from unittest.mock import AsyncMock, patch

import pytest
import redis

from app.services import cache


@pytest.mark.asyncio
async def test_get_returns_none_when_redis_is_unreachable():
    with patch.object(cache._redis, "get", new=AsyncMock(side_effect=redis.ConnectionError("refused"))):
        result = await cache.get_cached_translation("hello", "ur")
    assert result is None


@pytest.mark.asyncio
async def test_set_does_not_raise_when_redis_is_unreachable():
    with patch.object(cache._redis, "set", new=AsyncMock(side_effect=redis.ConnectionError("refused"))):
        await cache.set_cached_translation("hello", "ur", "سلام")  # should not raise


@pytest.mark.asyncio
async def test_get_returns_value_when_redis_works():
    with patch.object(cache._redis, "get", new=AsyncMock(return_value="سلام")):
        result = await cache.get_cached_translation("hello", "ur")
    assert result == "سلام"
