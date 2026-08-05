"""
Central config, loaded once from environment variables (.env locally,
Railway Variables in production). Nothing here should ever hold a
hardcoded secret — see .env.example for the full list of expected vars.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"
    log_level: str = "info"

    # Internal auth — the Node monolith must send this as `X-Service-Key`
    service_api_key: str = "changeme-generate-a-real-secret"

    # Translation: primary
    azure_translator_key: str = ""
    azure_translator_region: str = ""
    azure_translator_endpoint: str = "https://api.cognitive.microsofttranslator.com"

    # Translation: fallback (self-hosted)
    libretranslate_url: str = "http://libretranslate:5000"

    # Cache
    redis_url: str = "redis://redis:6379/0"
    translation_cache_ttl_seconds: int = 2592000

    # STT
    whisper_model_size: str = "small"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"
    max_voice_note_seconds: int = 60

    # Intent tier 2 (LLM)
    intent_llm_base_url: str = "http://ollama:11434/v1"
    intent_llm_model: str = "qwen2.5:7b-instruct"
    intent_llm_api_key: str = ""

    # Intent tier 3 (agent)
    agent_max_steps: int = 4
    agent_timeout_seconds: int = 8

    @property
    def azure_configured(self) -> bool:
        return bool(self.azure_translator_key and self.azure_translator_region)


@lru_cache
def get_settings() -> Settings:
    return Settings()
