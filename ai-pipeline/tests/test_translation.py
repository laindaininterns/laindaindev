from unittest.mock import AsyncMock, patch

import pytest

from app.services import translation


@pytest.mark.asyncio
async def test_same_language_skips_translation():
    result = await translation.translate("hello", target_lang="en", source_lang="en")
    assert result["provider"] == "none"
    assert result["translated_text"] == "hello"


@pytest.mark.asyncio
async def test_uses_cache_when_available():
    with patch("app.services.translation.get_cached_translation", new=AsyncMock(return_value="سلام")):
        result = await translation.translate("hello", target_lang="ur", source_lang="en")
    assert result["provider"] == "cache"
    assert result["translated_text"] == "سلام"


@pytest.mark.asyncio
async def test_falls_back_to_libretranslate_when_azure_fails():
    with (
        patch("app.services.translation.get_cached_translation", new=AsyncMock(return_value=None)),
        patch("app.services.translation.set_cached_translation", new=AsyncMock()),
        patch("app.services.translation._translate_azure", new=AsyncMock(side_effect=Exception("quota exceeded"))),
        patch("app.services.translation._translate_libretranslate", new=AsyncMock(return_value="سلام")),
    ):
        result = await translation.translate("hello", target_lang="ur", source_lang="en")

    assert result["provider"] == "libretranslate"
    assert result["translated_text"] == "سلام"


@pytest.mark.asyncio
async def test_raises_when_both_providers_fail():
    with (
        patch("app.services.translation.get_cached_translation", new=AsyncMock(return_value=None)),
        patch("app.services.translation._translate_azure", new=AsyncMock(side_effect=Exception("down"))),
        patch("app.services.translation._translate_libretranslate", new=AsyncMock(side_effect=Exception("down"))),
        pytest.raises(translation.TranslationError),
    ):
        await translation.translate("hello", target_lang="ur", source_lang="en")
