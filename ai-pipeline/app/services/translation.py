"""Translation provider abstraction.

Tries Azure Translator first (F0 free tier, 2M chars a month, good Urdu
quality). Falls back automatically to the self-hosted LibreTranslate
container if Azure errors out or its quota is exhausted, so a translation
request never hard fails just because one provider is unavailable.

Callers should go through translate(), not the provider functions
directly, so caching and fallback stay in one place.
"""

import logging

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings
from app.services.cache import get_cached_translation, set_cached_translation
from app.utils.lang_detect import detect_language

logger = logging.getLogger("ai_pipeline.translation")
settings = get_settings()


class TranslationError(Exception):
    pass


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.5, max=2))
async def _translate_azure(text: str, source_lang: str, target_lang: str) -> str:
    if not settings.azure_configured:
        raise TranslationError("Azure Translator is not configured")

    url = f"{settings.azure_translator_endpoint}/translate"
    params = {"api-version": "3.0", "from": source_lang, "to": target_lang}
    headers = {
        "Ocp-Apim-Subscription-Key": settings.azure_translator_key,
        "Ocp-Apim-Subscription-Region": settings.azure_translator_region,
        "Content-Type": "application/json",
    }
    body = [{"text": text}]

    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.post(url, params=params, headers=headers, json=body)
        response.raise_for_status()
        data = response.json()
        return data[0]["translations"][0]["text"]


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.5, max=2))
async def _translate_libretranslate(text: str, source_lang: str, target_lang: str) -> str:
    url = f"{settings.libretranslate_url}/translate"
    payload = {"q": text, "source": source_lang, "target": target_lang, "format": "text"}

    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        return response.json()["translatedText"]


async def translate(text: str, target_lang: str, source_lang: str | None = None) -> dict:
    """
    Returns a dict with translated_text, source_lang, provider, cached.
    Raises TranslationError only if both providers fail, callers should
    catch this and deliver the original text rather than block the message.
    """
    source_lang = source_lang or detect_language(text)

    if source_lang == target_lang:
        return {
            "translated_text": text,
            "source_lang": source_lang,
            "provider": "none",
            "cached": False,
        }

    cached = await get_cached_translation(text, target_lang)
    if cached is not None:
        return {
            "translated_text": cached,
            "source_lang": source_lang,
            "provider": "cache",
            "cached": True,
        }

    try:
        # Deliberately broad: any Azure failure (quota, network, bad response
        # shape) should fall back to LibreTranslate rather than bubble up.
        translated_text = await _translate_azure(text, source_lang, target_lang)
        provider = "azure"
    except Exception as azure_error:  # noqa: BLE001
        logger.warning("Azure translation failed, falling back to LibreTranslate: %s", azure_error)
        try:
            translated_text = await _translate_libretranslate(text, source_lang, target_lang)
            provider = "libretranslate"
        except Exception as fallback_error:
            logger.error("Both translation providers failed: %s", fallback_error)
            raise TranslationError("Both translation providers are unavailable") from fallback_error

    await set_cached_translation(text, target_lang, translated_text)
    return {
        "translated_text": translated_text,
        "source_lang": source_lang,
        "provider": provider,
        "cached": False,
    }
