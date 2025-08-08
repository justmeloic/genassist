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

"""Schemas for Gemini Live API WebSocket integration."""

from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field

from .gemini_live import VoiceName


class ChatMode(str, Enum):
    """Chat mode types."""

    VOICE = "voice"
    SCREEN = "screen"
    CAMERA = "camera"


class WebSocketMessageType(str, Enum):
    """WebSocket message types."""

    # Connection management
    CONNECT = "connect"
    DISCONNECT = "disconnect"
    ERROR = "error"

    # Audio messages
    AUDIO_DATA = "audio_data"
    AUDIO_CONFIG = "audio_config"

    # Text messages
    TEXT_MESSAGE = "text_message"
    TEXT_RESPONSE = "text_response"

    # Screen/Camera messages
    SCREEN_DATA = "screen_data"
    CAMERA_DATA = "camera_data"

    # Transcription messages
    INPUT_TRANSCRIPTION = "input_transcription"
    OUTPUT_TRANSCRIPTION = "output_transcription"

    # Session management
    SESSION_START = "session_start"
    SESSION_END = "session_end"
    SESSION_CONFIG = "session_config"


class AudioConfig(BaseModel):
    """Audio configuration for WebSocket session."""

    sample_rate: int = Field(default=16000, description="Audio sample rate for input")
    output_sample_rate: int = Field(
        default=24000, description="Audio sample rate for output"
    )
    channels: int = Field(default=1, description="Number of audio channels")
    format: str = Field(default="pcm", description="Audio format")


class SessionConfig(BaseModel):
    """Configuration for a live chat session."""

    chat_mode: ChatMode
    voice_name: VoiceName = Field(default=VoiceName.KORE)
    system_instruction: Optional[str] = Field(
        default="You are a helpful AI assistant having a natural conversation.",
        description="System instruction for the AI",
    )
    enable_input_transcription: bool = Field(default=True)
    enable_output_transcription: bool = Field(default=True)
    audio_config: AudioConfig = Field(default_factory=AudioConfig)


class WebSocketMessage(BaseModel):
    """Base WebSocket message structure."""

    type: WebSocketMessageType
    session_id: Optional[str] = None
    timestamp: Optional[float] = None
    data: Optional[Dict[str, Any]] = None


class ConnectMessage(WebSocketMessage):
    """Connection request message."""

    type: WebSocketMessageType = WebSocketMessageType.CONNECT
    data: SessionConfig


class AudioMessage(WebSocketMessage):
    """Audio data message."""

    type: WebSocketMessageType = WebSocketMessageType.AUDIO_DATA
    data: Dict[
        str, Union[str, bytes, int]
    ]  # {"audio": base64_audio_data, "mime_type": "audio/pcm", "sample_rate": 24000}


class TextMessage(WebSocketMessage):
    """Text message."""

    type: WebSocketMessageType = WebSocketMessageType.TEXT_MESSAGE
    data: Dict[str, str]  # {"text": "message content"}


class ScreenMessage(WebSocketMessage):
    """Screen capture message."""

    type: WebSocketMessageType = WebSocketMessageType.SCREEN_DATA
    data: Dict[str, str]  # {"image": base64_image_data, "mime_type": "image/jpeg"}


class CameraMessage(WebSocketMessage):
    """Camera data message."""

    type: WebSocketMessageType = WebSocketMessageType.CAMERA_DATA
    data: Dict[str, str]  # {"image": base64_image_data, "mime_type": "image/jpeg"}


class TranscriptionMessage(WebSocketMessage):
    """Transcription message."""

    type: WebSocketMessageType
    data: Dict[str, str]  # {"text": "transcribed text"}


class ErrorMessage(WebSocketMessage):
    """Error message."""

    type: WebSocketMessageType = WebSocketMessageType.ERROR
    data: Dict[str, str]  # {"error": "error message", "code": "error_code"}


class SessionStartMessage(WebSocketMessage):
    """Session started confirmation message."""

    type: WebSocketMessageType = WebSocketMessageType.SESSION_START
    data: Dict[str, Any]  # {"session_id": "...", "config": {...}}


class SessionEndMessage(WebSocketMessage):
    """Session ended message."""

    type: WebSocketMessageType = WebSocketMessageType.SESSION_END
    data: Dict[str, str]  # {"reason": "user_disconnect"}


# Response models for REST endpoints
class SessionInfo(BaseModel):
    """Information about an active session."""

    session_id: str
    chat_mode: ChatMode
    voice_name: VoiceName
    connected_at: float
    last_activity: float
    is_active: bool


class ActiveSessionsResponse(BaseModel):
    """Response containing active sessions."""

    sessions: List[SessionInfo]
    total_count: int


class SessionStatsResponse(BaseModel):
    """Session statistics response."""

    total_sessions: int
    active_sessions: int
    voice_sessions: int
    screen_sessions: int
    camera_sessions: int
    average_session_duration: float
