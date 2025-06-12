"""Application configuration."""

import os
from functools import lru_cache

from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    PROJECT_NAME: str = "Document Service API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Gemini API Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL_DOCUMENT: str = "gemini-2.5-flash-preview-05-20"
    GEMINI_MODEL_TTS: str = "gemini-2.5-flash-preview-tts"

    # API Configuration
    API_V1_STR: str = "/v1/api"
    ALLOWED_HOSTS: list = ["*"]

    # Audio Configuration
    AUDIO_SAMPLE_RATE: int = 24000
    AUDIO_CHANNELS: int = 1
    AUDIO_SAMPLE_WIDTH: int = 2
    DEFAULT_VOICE: str = "Kore"

    # File Configuration
    UPLOAD_DIR: str = "uploads"
    OUTPUT_DIR: str = "outputs"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
