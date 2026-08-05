"""Entrypoint for the AI pipeline service (translation, speech to text,
intent parsing). Runs as its own process, separate from the Node
monolith, and is called over HTTP using the shared service key.

See ai-pipeline/README.md for how to run this locally and
docs/api_contract.md for what the Node side should expect from it.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import router
from app.config import get_settings
from app.services import stt

settings = get_settings()

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger("ai_pipeline")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load Whisper once at startup so the first real request isn't the one
    # that pays the model load cost.
    logger.info("Warming up Whisper model...")
    stt.load_model()
    logger.info("Ready.")
    yield


app = FastAPI(
    title="Lain Dain AI Pipeline",
    description="Translation, speech to text, and intent parsing for the marketplace chat and voice features.",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "environment": settings.environment}
