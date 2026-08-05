"""Public API surface. This is the whole contract the Node monolith codes
against, see docs/api_contract.md for the human-readable version of the
same thing.
"""

import logging
import os
import tempfile
import uuid

import anyio
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.api.deps import require_service_key
from app.models.schemas import (
    ParseIntentRequest,
    ParseIntentResponse,
    TranscribeResponse,
    TranslateRequest,
    TranslateResponse,
)
from app.services import stt, translation
from app.services.intent.router import resolve_intent

logger = logging.getLogger("ai_pipeline.api")

router = APIRouter(dependencies=[Depends(require_service_key)])


def _write_file(path: str, contents: bytes) -> None:
    with open(path, "wb") as f:
        f.write(contents)


def _remove_file_if_exists(path: str) -> None:
    if os.path.exists(path):
        os.remove(path)


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(payload: TranslateRequest) -> TranslateResponse:
    try:
        result = await translation.translate(
            text=payload.text,
            target_lang=payload.target_lang,
            source_lang=payload.source_lang,
        )
    except translation.TranslationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Translation is temporarily unavailable, deliver the original text instead",
        ) from exc

    return TranslateResponse(
        translated_text=result["translated_text"],
        source_lang=result["source_lang"],
        target_lang=payload.target_lang,
        provider=result["provider"],
        cached=result["cached"],
    )


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(audio: UploadFile) -> TranscribeResponse:
    max_bytes = 15 * 1024 * 1024  # rough cap, matched by MAX_VOICE_NOTE_SECONDS in practice
    contents = await audio.read(max_bytes + 1)
    if len(contents) > max_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Audio file too large")

    suffix = os.path.splitext(audio.filename or "")[1] or ".ogg"
    tmp_path = os.path.join(tempfile.gettempdir(), f"voice_{uuid.uuid4().hex}{suffix}")

    try:
        await anyio.to_thread.run_sync(_write_file, tmp_path, contents)
        result = await anyio.to_thread.run_sync(stt.transcribe, tmp_path)
    finally:
        await anyio.to_thread.run_sync(_remove_file_if_exists, tmp_path)

    return TranscribeResponse(**result)


@router.post("/parse-intent", response_model=ParseIntentResponse)
async def parse_intent(payload: ParseIntentRequest) -> ParseIntentResponse:
    result = await resolve_intent(payload.text)
    return ParseIntentResponse(
        intent=result["intent"],
        entities=result["entities"],
        confidence=result["confidence"],
        tier=result["tier"],
        requires_confirmation=result["requires_confirmation"],
    )
