"""Development-only routes. Never mounted in production, see main.py where
this router is only included when ENVIRONMENT=development.

Currently just the local voice tester page, a self-contained HTML page
that records from your microphone in the browser and walks the audio
through /transcribe, /translate, and /parse-intent so you can see the
whole pipeline react to your actual voice without any extra tooling.
"""

from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse

router = APIRouter()

_STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@router.get("/dev/voice-tester")
async def voice_tester_page() -> FileResponse:
    return FileResponse(_STATIC_DIR / "voice_tester.html")
