"""Core configuration settings."""

import os
from typing import Any, Dict, Optional
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    """Core application settings."""

    # Basic app settings
    PROJECT_NAME: str = "Document Service API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Security
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Gemini API
    GEMINI_API_KEY: str
    GEMINI_MODEL_DOCUMENT: str = "gemini-2.0-flash"
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

    @validator("GEMINI_API_KEY", pre=True)
    def validate_gemini_api_key(cls, v: str) -> str:
        if not v:
            raise ValueError("GEMINI_API_KEY must be set")
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
