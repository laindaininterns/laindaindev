"""Speech to text, self-hosted via faster-whisper.

The model is loaded once at process start and kept warm in memory,
reloading it per request is the single biggest latency killer for a
voice pipeline, so main.py's lifespan hook is what actually creates
this and hands it to the request handlers.

Whisper also supports translating straight to English as part of
transcription, so a single pass gives us both the original-language
transcript (kept for the audit trail) and an English version for the
intent parser, without a second model call.
"""

import logging
import time
from typing import TYPE_CHECKING

from app.config import get_settings

if TYPE_CHECKING:
    from faster_whisper import WhisperModel

logger = logging.getLogger("ai_pipeline.stt")
settings = get_settings()

_model: "WhisperModel | None" = None


def load_model() -> "WhisperModel":
    # Imported lazily, not at module load time, so that code which never
    # touches speech to text (translation, intent tests, etc.) doesn't
    # need faster-whisper and its large ML dependencies installed just to
    # be imported or tested.
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        logger.info(
            "Loading Whisper model=%s device=%s compute_type=%s",
            settings.whisper_model_size,
            settings.whisper_device,
            settings.whisper_compute_type,
        )
        _model = WhisperModel(
            settings.whisper_model_size,
            device=settings.whisper_device,
            compute_type=settings.whisper_compute_type,
        )
    return _model


def transcribe(audio_path: str) -> dict:
    """
    Runs two passes over the audio: one in the original language, one
    translated to English. faster-whisper decodes fast enough on CPU for
    short voice notes that this is acceptable for v1, worth revisiting
    with a single-pass approach if latency becomes a problem at scale.
    """
    model = load_model()
    start = time.monotonic()

    segments_original, info = model.transcribe(audio_path, task="transcribe")
    transcript_original = " ".join(segment.text.strip() for segment in segments_original)

    detected_lang = "ur" if info.language == "ur" else "en"

    if detected_lang == "en":
        transcript_english = transcript_original
    else:
        segments_english, _ = model.transcribe(audio_path, task="translate")
        transcript_english = " ".join(segment.text.strip() for segment in segments_english)

    duration_seconds = time.monotonic() - start
    logger.info("Transcription finished in %.2fs (lang=%s)", duration_seconds, detected_lang)

    return {
        "transcript_original": transcript_original,
        "transcript_english": transcript_english,
        "detected_lang": detected_lang,
        "duration_seconds": duration_seconds,
    }
