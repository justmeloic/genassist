# Copyright 2025 Loïc Muhirwa
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Text-to-speech API schemas."""

from typing import List, Optional

from pydantic import BaseModel, Field, ValidationInfo, field_validator

from src.app.core.config import settings
from src.app.models.text2speech import SpeechPitch, SpeechSpeed, VoiceName


class SpeakerConfig(BaseModel):
    """Speaker configuration for multi-speaker TTS."""

    speaker: str = Field(..., description="Speaker identifier in the conversation")
    voice_name: VoiceName = Field(
        default=VoiceName.KORE,
        description="Voice to use for this speaker",
    )


class Text2SpeechRequest(BaseModel):
    """Text-to-speech request schema."""

    text: str = Field(
        ...,
        description="Text to convert to speech",
        min_length=1,
        max_length=50000,
    )
    is_multi_speaker: bool = Field(
        default=False, description="Whether to use multi-speaker TTS"
    )
    voice_name: Optional[VoiceName] = Field(
        default=VoiceName.KORE, description="Voice to use for single speaker TTS"
    )
    speakers: Optional[List[SpeakerConfig]] = Field(
        default=None,
        description="Speaker configurations for multi-speaker TTS. If not provided, defaults will be used.",
    )
    speed: SpeechSpeed = Field(
        default=SpeechSpeed.NORMAL,
        description="Speech speed",
    )
    pitch: SpeechPitch = Field(
        default=SpeechPitch.NORMAL,
        description="Speech pitch",
    )

    @field_validator("speakers")
    @classmethod
    def validate_speakers(
        cls, v: Optional[List[SpeakerConfig]], info: ValidationInfo
    ) -> Optional[List[SpeakerConfig]]:
        """
        Validate speaker configurations based on the is_multi_speaker flag.

        If multi-speaker is enabled and no speakers are provided, this validator
        populates the speakers list with default values from the application settings.
        """
        if info.data.get("is_multi_speaker"):
            if not v:
                # Use default speakers if none are provided for multi-speaker mode
                return [
                    SpeakerConfig(**s.model_dump()) for s in settings.DEFAULT_SPEAKERS
                ]
        elif v:
            raise ValueError("Speakers should not be provided for single-speaker TTS")
        return v


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
