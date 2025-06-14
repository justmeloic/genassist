"""Core configuration settings."""

from typing import Dict, List
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from pydantic import validator


class SpeakerDefaults(BaseModel):
    """Default speaker configuration."""

    speaker: str
    voice_name: str


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
    GEMINI_MODEL_MULTI_TTS: str = "gemini-2.5-flash-preview-tts"
    GEMINI_MODEL_VIDEO: str = "veo-2.0-generate-001"

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
    OUTPUT_DIR: str = "audio_outputs"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB

    # Video Configuration
    VIDEO_OUTPUT_DIR: str = "video_outputs"
    VIDEO_ASPECT_RATIO: str = "16:9"
    VIDEO_PERSON_GENERATION: str = "dont_allow"

    # Default Speakers Configuration
    DEFAULT_SPEAKERS: List[Dict[str, str]] = [
        {"speaker": "Joe", "voice_name": "Algieba"},
        {"speaker": "Jane", "voice_name": "Kore"},
    ]

    @validator("GEMINI_API_KEY", pre=True)
    def validate_gemini_api_key(cls, v: str) -> str:
        if not v:
            raise ValueError("GEMINI_API_KEY must be set")
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
