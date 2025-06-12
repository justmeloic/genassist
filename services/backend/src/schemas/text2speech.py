"""Text-to-speech API schemas."""

from typing import Optional

from pydantic import BaseModel, Field, validator

from src.models.text2speech import VoiceName, SpeechSpeed, SpeechPitch


class Text2SpeechRequest(BaseModel):
    """Text-to-speech request schema."""

    text: str = Field(
        ...,
        description="Text to convert to speech",
        min_length=1,
        max_length=50000,
    )
    voice_name: VoiceName = Field(
        default=VoiceName.KORE,
        description="Voice to use for speech generation",
    )
    speed: SpeechSpeed = Field(
        default=SpeechSpeed.NORMAL,
        description="Speech speed",
    )
    pitch: SpeechPitch = Field(
        default=SpeechPitch.NORMAL,
        description="Speech pitch",
    )

    @validator("text")
    def validate_text(cls, v):
        if not v.strip():
            raise ValueError("Text cannot be empty")
        return v.strip()


class Text2SpeechResponse(BaseModel):
    """Text-to-speech response schema."""

    audio_file_id: str = Field(
        ...,
        description="Unique identifier for the generated audio file",
    )
    filename: str = Field(
        ...,
        description="Generated audio filename",
    )
    file_path: str = Field(
        ...,
        description="Path to the generated audio file",
    )
    duration_seconds: float = Field(
        ...,
        description="Duration of the audio in seconds",
    )
    file_size_bytes: int = Field(
        ...,
        description="File size in bytes",
    )
    status: str = Field(
        ...,
        description="Processing status",
    )
