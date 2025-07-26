"""Core configuration settings."""

from typing import Dict, List

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic_settings import BaseSettings


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
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    AUTH_SECRET: str

    # Gemini API
    GEMINI_API_KEY: str = ""  # Optional - users provide at login
    GEMINI_MODEL_DOCUMENT: str = "gemini-2.0-flash"
    GEMINI_MODEL_TTS: str = "gemini-2.5-flash-preview-tts"
    GEMINI_MODEL_MULTI_TTS: str = "gemini-2.5-flash-preview-tts"
    GEMINI_MODEL_VIDEO: str = "veo-2.0-generate-001"
    GEMINI_MODEL_IMAGE: str = "imagen-4.0-generate-preview-06-06"
    GEMINI_MODEL_LIVE_HALF_CASCADE: str = "gemini-live-2.5-flash-preview"
    GEMINI_MODEL_LIVE_NATIVE_AUDIO: str = "gemini-2.5-flash-preview-native-audio-dialog"
    GEMINI_MODEL_LIVE_THINKING: str = (
        "gemini-2.5-flash-exp-native-audio-thinking-dialog"
    )

    # API Configuration
    API_V1_STR: str = "/v1/api"
    ALLOWED_HOSTS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "https://*.ngrok-free.app",  # Handled by regex in main.py
    ]

    # Audio Configuration
    AUDIO_SAMPLE_RATE: int = 24000
    AUDIO_CHANNELS: int = 1
    AUDIO_SAMPLE_WIDTH: int = 2
    DEFAULT_VOICE: str = "Kore"

    # File Configuration
    AUDIO_OUTPUT_DIR: str
    VIDEO_OUTPUT_DIR: str
    IMAGE_OUTPUT_DIR: str
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB

    # Video Configuration
    VIDEO_ASPECT_RATIO: str = "16:9"
    VIDEO_PERSON_GENERATION: str = "allow_adult"

    # Default Speakers Configuration
    DEFAULT_SPEAKERS: List[SpeakerDefaults] = [
        SpeakerDefaults(speaker="Joe", voice_name="Algieba"),
        SpeakerDefaults(speaker="Jane", voice_name="Kore"),
    ]

    model_config = ConfigDict(env_file=".env", case_sensitive=True)

    @field_validator("GEMINI_API_KEY", mode="before")
    @classmethod
    def validate_gemini_api_key(cls, v: str) -> str:
        """
        Validates the GEMINI_API_KEY (now optional since users provide it at login).

        Args:
            v: The value of the GEMINI_API_KEY from the environment.

        Returns:
            The API key (can be empty string).
        """
        # Allow empty string since users will provide API key at login
        return v or ""


settings = Settings()
