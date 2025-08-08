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

"""FastAPI dependencies."""

from functools import lru_cache

from src.app.services.document_edit_service import DocumentEditService
from src.app.services.gemini_live_web_service import GeminiLiveWebSocketService
from src.app.services.text2image_service import Text2ImageService
from src.app.services.text2speech_service import Text2SpeechService
from src.app.services.text2video_service import Text2VideoService


@lru_cache()
def get_document_edit_service() -> DocumentEditService:
    """Get document edit service instance."""
    return DocumentEditService()


@lru_cache()
def get_text2speech_service() -> Text2SpeechService:
    """Get text-to-speech service instance."""
    return Text2SpeechService()


@lru_cache()
def get_text2image_service() -> Text2ImageService:
    """Get text-to-image service instance."""
    return Text2ImageService()


@lru_cache()
def get_text2video_service() -> Text2VideoService:
    """Get text-to-video service instance."""
    return Text2VideoService()


@lru_cache()
def get_tts_service() -> Text2SpeechService:
    """Get text-to-speech service instance (alias for compatibility)."""
    return Text2SpeechService()


@lru_cache()
def get_gemini_live_websocket_service() -> GeminiLiveWebSocketService:
    """Get Gemini Live WebSocket service instance."""
    return GeminiLiveWebSocketService()
