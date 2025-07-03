"""Gemini Live API schemas."""

from enum import Enum
from typing import Dict, Optional

from pydantic import BaseModel, Field


class ResponseModality(str, Enum):
    """Response modalities for Gemini Live."""

    TEXT = "TEXT"
    AUDIO = "AUDIO"


class VoiceName(str, Enum):
    """Available voice names for Live API."""

    # Half-cascade voices
    PUCK = "Puck"
    CHARON = "Charon"
    KORE = "Kore"
    FENRIR = "Fenrir"
    AOEDE = "Aoede"
    LEDA = "Leda"
    ORUS = "Orus"
    ZEPHYR = "Zephyr"


class LanguageCode(str, Enum):
    """Supported language codes for Live API."""

    EN_US = "en-US"
    EN_GB = "en-GB"
    EN_AU = "en-AU"
    EN_IN = "en-IN"
    DE_DE = "de-DE"
    ES_US = "es-US"
    ES_ES = "es-ES"
    FR_FR = "fr-FR"
    FR_CA = "fr-CA"
    PT_BR = "pt-BR"
    IT_IT = "it-IT"
    JA_JP = "ja-JP"
    KO_KR = "ko-KR"
    ZH_CN = "cmn-CN"
    HI_IN = "hi-IN"
    AR_XA = "ar-XA"


class MediaResolution(str, Enum):
    """Media resolution settings."""

    LOW = "MEDIA_RESOLUTION_LOW"
    MEDIUM = "MEDIA_RESOLUTION_MEDIUM"
    HIGH = "MEDIA_RESOLUTION_HIGH"


class StartSensitivity(str, Enum):
    """Voice Activity Detection start sensitivity."""

    LOW = "START_SENSITIVITY_LOW"
    MEDIUM = "START_SENSITIVITY_MEDIUM"
    HIGH = "START_SENSITIVITY_HIGH"


class EndSensitivity(str, Enum):
    """Voice Activity Detection end sensitivity."""

    LOW = "END_SENSITIVITY_LOW"
    MEDIUM = "END_SENSITIVITY_MEDIUM"
    HIGH = "END_SENSITIVITY_HIGH"


class VoiceActivityDetectionConfig(BaseModel):
    """Voice Activity Detection configuration."""

    disabled: bool = Field(
        default=False, description="Whether to disable automatic VAD"
    )
    start_of_speech_sensitivity: Optional[StartSensitivity] = Field(
        default=StartSensitivity.MEDIUM, description="Start of speech sensitivity"
    )
    end_of_speech_sensitivity: Optional[EndSensitivity] = Field(
        default=EndSensitivity.MEDIUM, description="End of speech sensitivity"
    )
    prefix_padding_ms: Optional[int] = Field(
        default=20, description="Prefix padding in milliseconds"
    )
    silence_duration_ms: Optional[int] = Field(
        default=100, description="Silence duration in milliseconds"
    )


class LiveSessionConfig(BaseModel):
    """Configuration for a Gemini Live session."""

    response_modality: ResponseModality = Field(
        default=ResponseModality.TEXT, description="Response modality (TEXT or AUDIO)"
    )
    system_instruction: Optional[str] = Field(
        default=None, description="System instruction for the model"
    )
    voice_name: Optional[VoiceName] = Field(
        default=VoiceName.KORE, description="Voice to use for audio responses"
    )
    language_code: Optional[LanguageCode] = Field(
        default=LanguageCode.EN_US, description="Language code for responses"
    )
    media_resolution: Optional[MediaResolution] = Field(
        default=MediaResolution.MEDIUM, description="Media resolution"
    )
    enable_input_audio_transcription: bool = Field(
        default=False, description="Enable transcription of input audio"
    )
    enable_output_audio_transcription: bool = Field(
        default=False, description="Enable transcription of output audio"
    )
    vad_config: Optional[VoiceActivityDetectionConfig] = Field(
        default=None, description="Voice Activity Detection configuration"
    )


class TextMessage(BaseModel):
    """Text message for Live API."""

    text: str = Field(..., description="Text content of the message")


class AudioMessage(BaseModel):
    """Audio message for Live API."""

    audio_data: bytes = Field(..., description="Raw audio data (16-bit PCM)")
    sample_rate: int = Field(default=16000, description="Audio sample rate")


class LiveChatRequest(BaseModel):
    """Request for Live API chat."""

    message: str = Field(..., description="Text message to send")
    session_config: Optional[LiveSessionConfig] = Field(
        default=None, description="Session configuration"
    )


class LiveAudioRequest(BaseModel):
    """Request for Live API audio interaction."""

    audio_data: bytes = Field(..., description="Raw audio data")
    session_config: Optional[LiveSessionConfig] = Field(
        default=None, description="Session configuration"
    )


class LiveResponse(BaseModel):
    """Response from Live API."""

    response_id: str = Field(..., description="Unique response identifier")
    text: Optional[str] = Field(default=None, description="Text response")
    audio_filename: Optional[str] = Field(
        default=None, description="Audio response filename"
    )
    transcript: Optional[str] = Field(default=None, description="Audio transcript")
    session_id: Optional[str] = Field(default=None, description="Session identifier")
    usage_metadata: Optional[Dict] = Field(
        default=None, description="Token usage information"
    )
