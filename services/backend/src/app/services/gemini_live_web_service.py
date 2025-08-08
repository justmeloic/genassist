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

"""WebSocket service for Gemini Live API integration."""

import asyncio
import base64
import time
import uuid
from typing import Dict, Optional

from fastapi import WebSocket, WebSocketDisconnect
from loguru import logger

from ..schemas.gemini_live import LiveSessionConfig, ResponseModality
from ..schemas.gemini_live_web import (
    AudioMessage,
    CameraMessage,
    ChatMode,
    ConnectMessage,
    ErrorMessage,
    ScreenMessage,
    SessionConfig,
    SessionStartMessage,
    TextMessage,
    TranscriptionMessage,
    WebSocketMessage,
    WebSocketMessageType,
)
from ..services.gemini_live_service import GeminiLiveService


class SessionManager:
    """Manages active WebSocket sessions."""

    def __init__(self):
        """Initialize session manager."""
        self.active_sessions: Dict[str, "LiveChatSession"] = {}
        self.websocket_to_session: Dict[WebSocket, str] = {}

    def create_session(
        self, websocket: WebSocket, config: SessionConfig
    ) -> "LiveChatSession":
        """Create a new session."""
        session_id = str(uuid.uuid4())
        session = LiveChatSession(session_id, websocket, config)

        self.active_sessions[session_id] = session
        self.websocket_to_session[websocket] = session_id

        logger.info(f"Created session {session_id} for {config.chat_mode}")
        return session

    def get_session(self, session_id: str) -> Optional["LiveChatSession"]:
        """Get session by ID."""
        return self.active_sessions.get(session_id)

    def get_session_by_websocket(
        self, websocket: WebSocket
    ) -> Optional["LiveChatSession"]:
        """Get session by WebSocket."""
        session_id = self.websocket_to_session.get(websocket)
        if session_id:
            return self.active_sessions.get(session_id)
        return None

    def remove_session(self, session_id: str):
        """Remove a session."""
        session = self.active_sessions.pop(session_id, None)
        if session:
            # Remove WebSocket mapping
            self.websocket_to_session.pop(session.websocket, None)
            logger.info(f"Removed session {session_id}")

    def get_all_sessions(self) -> Dict[str, "LiveChatSession"]:
        """Get all active sessions."""
        return self.active_sessions.copy()

    def cleanup_inactive_sessions(self, timeout_seconds: int = 300):
        """Clean up sessions that have been inactive for too long."""
        current_time = time.time()
        inactive_sessions = []

        for session_id, session in self.active_sessions.items():
            if current_time - session.last_activity > timeout_seconds:
                inactive_sessions.append(session_id)

        for session_id in inactive_sessions:
            logger.warning(f"Cleaning up inactive session {session_id}")
            self.remove_session(session_id)


class LiveChatSession:
    """Represents a single live chat session."""

    def __init__(self, session_id: str, websocket: WebSocket, config: SessionConfig):
        """Initialize session."""
        self.session_id = session_id
        self.websocket = websocket
        self.config = config
        self.connected_at = time.time()
        self.last_activity = time.time()
        self.is_active = False

        # Gemini Live API components
        self.live_service = GeminiLiveService()
        self.gemini_session = None
        self.gemini_context_manager = None
        self.audio_out_queue = None

        # Background tasks
        self.tasks = []

    def update_activity(self):
        """Update last activity timestamp."""
        self.last_activity = time.time()

    async def start_gemini_session(self):
        """Start the Gemini Live API session."""
        try:
            # Convert config to LiveSessionConfig
            live_config = LiveSessionConfig(
                response_modality=ResponseModality.AUDIO,
                voice_name=self.config.voice_name,
                system_instruction=self.config.system_instruction,
                enable_input_audio_transcription=self.config.enable_input_transcription,
                enable_output_audio_transcription=self.config.enable_output_transcription,
            )

            # Connect to Gemini Live API and store the context manager
            self.gemini_context_manager = self.live_service.client.aio.live.connect(
                model=self.live_service.native_audio_model,
                config=self.live_service._create_session_config(live_config),
            )

            # Enter the context manager
            self.gemini_session = await self.gemini_context_manager.__aenter__()

            # Create audio output queue
            self.audio_out_queue = asyncio.Queue()

            self.is_active = True

            # Start background tasks
            self.tasks.append(asyncio.create_task(self._handle_gemini_responses()))
            self.tasks.append(asyncio.create_task(self._process_audio_output()))

            logger.info(f"Started Gemini session for {self.session_id}")

        except Exception as e:
            logger.error(f"Failed to start Gemini session for {self.session_id}: {e}")
            raise

    async def stop_gemini_session(self):
        """Stop the Gemini Live API session."""
        self.is_active = False

        # Cancel background tasks
        for task in self.tasks:
            if not task.done():
                task.cancel()

        # Wait for tasks to complete
        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)

        # Close Gemini session using the context manager
        if self.gemini_session and hasattr(self, "gemini_context_manager"):
            try:
                await self.gemini_context_manager.__aexit__(None, None, None)
            except Exception as e:
                logger.warning(f"Error closing Gemini session: {e}")

        logger.info(f"Stopped Gemini session for {self.session_id}")

    async def send_audio(self, audio_data: bytes, mime_type: str = "audio/pcm"):
        """Send audio data to Gemini."""
        if self.gemini_session and self.is_active:
            try:
                await self.gemini_session.send_realtime_input(
                    audio={"data": audio_data, "mime_type": mime_type}
                )
                self.update_activity()
            except Exception as e:
                logger.error(f"Failed to send audio: {e}")
                raise

    async def send_text(self, text: str):
        """Send text message to Gemini."""
        if self.gemini_session and self.is_active:
            try:
                logger.info(f"Sending text to Gemini: '{text}'")
                await self.gemini_session.send_client_content(
                    turns={"role": "user", "parts": [{"text": text}]},
                    turn_complete=True,
                )
                logger.info(f"Text sent successfully to session {self.session_id}")
                self.update_activity()
            except Exception as e:
                logger.error(f"Failed to send text: {e}")
                raise

    async def send_image(self, image_data: str, mime_type: str = "image/jpeg"):
        """Send image data to Gemini (for screen/camera)."""
        if self.gemini_session and self.is_active:
            try:
                await self.gemini_session.send(
                    input={"data": image_data, "mime_type": mime_type}
                )
                self.update_activity()
            except Exception as e:
                logger.error(f"Failed to send image: {e}")
                raise

    async def _handle_gemini_responses(self):
        """Handle responses from Gemini Live API."""
        logger.info(f"Starting Gemini response handler for session {self.session_id}")
        while self.is_active and self.gemini_session:
            try:
                # Get the next turn from the session
                logger.debug(f"Waiting for turn from Gemini session {self.session_id}")
                turn = self.gemini_session.receive()

                # Process all responses in this turn
                async for response in turn:
                    if not self.is_active:
                        break

                    logger.debug(f"Received response type: {type(response).__name__}")

                    # Handle direct audio data (if any)
                    if hasattr(response, "data") and response.data:
                        logger.info(
                            f"Received direct audio data: {len(response.data)} bytes"
                        )
                        await self.audio_out_queue.put(response.data)

                    # Handle direct text responses (if any)
                    if hasattr(response, "text") and response.text:
                        logger.info(f"Received direct text: {response.text}")
                        await self._send_websocket_message(
                            WebSocketMessage(
                                type=WebSocketMessageType.TEXT_RESPONSE,
                                session_id=self.session_id,
                                timestamp=time.time(),
                                data={"text": response.text},
                            )
                        )

                    # Handle server content
                    if hasattr(response, "server_content") and response.server_content:
                        server_content = response.server_content
                        logger.debug(
                            f"Processing server content for session {self.session_id}"
                        )

                        # Handle model turn with parts (contains audio and text)
                        if (
                            server_content.model_turn
                            and server_content.model_turn.parts
                        ):
                            logger.info(
                                f"Model turn has {len(server_content.model_turn.parts)} parts"
                            )
                            for i, part in enumerate(server_content.model_turn.parts):
                                # Handle audio data in parts
                                if (
                                    hasattr(part, "inline_data")
                                    and part.inline_data
                                    and part.inline_data.data
                                ):
                                    logger.info(
                                        f"Part {i}: Audio data {len(part.inline_data.data)} bytes"
                                    )
                                    await self.audio_out_queue.put(
                                        part.inline_data.data
                                    )

                                # Handle text in parts
                                if hasattr(part, "text") and part.text:
                                    logger.info(f"Part {i}: Text '{part.text}'")
                                    await self._send_websocket_message(
                                        WebSocketMessage(
                                            type=WebSocketMessageType.TEXT_RESPONSE,
                                            session_id=self.session_id,
                                            timestamp=time.time(),
                                            data={"text": part.text},
                                        )
                                    )

                        # Handle transcriptions
                        await self._handle_transcriptions(server_content)

            except asyncio.CancelledError:
                logger.info(f"Gemini response handler cancelled for {self.session_id}")
                break
            except Exception as e:
                if self.is_active:
                    logger.error(f"Error handling Gemini responses: {e}")
                    import traceback

                    logger.error(f"Traceback: {traceback.format_exc()}")
                    # Wait a bit before retrying
                    await asyncio.sleep(1)
                else:
                    break

        logger.info(f"Gemini response handler stopped for session {self.session_id}")

    async def _handle_transcriptions(self, server_content):
        """Handle transcription data from server."""
        # Input transcription (user speech)
        if (
            server_content.input_transcription
            and server_content.input_transcription.text
        ):
            logger.info(
                f"Input transcription: {server_content.input_transcription.text}"
            )
            await self._send_websocket_message(
                TranscriptionMessage(
                    type=WebSocketMessageType.INPUT_TRANSCRIPTION,
                    session_id=self.session_id,
                    timestamp=time.time(),
                    data={"text": server_content.input_transcription.text},
                )
            )

        # Output transcription (AI speech)
        if (
            server_content.output_transcription
            and server_content.output_transcription.text
        ):
            logger.info(
                f"Output transcription: {server_content.output_transcription.text}"
            )
            await self._send_websocket_message(
                TranscriptionMessage(
                    type=WebSocketMessageType.OUTPUT_TRANSCRIPTION,
                    session_id=self.session_id,
                    timestamp=time.time(),
                    data={"text": server_content.output_transcription.text},
                )
            )

    async def _process_audio_output(self):
        """Process audio output from Gemini and send to WebSocket."""
        while self.is_active:
            try:
                # Get audio data from queue
                audio_data = await self.audio_out_queue.get()

                # Encode as base64 and send via WebSocket
                audio_base64 = base64.b64encode(audio_data).decode()
                await self._send_websocket_message(
                    AudioMessage(
                        type=WebSocketMessageType.AUDIO_DATA,
                        session_id=self.session_id,
                        timestamp=time.time(),
                        data={
                            "audio": audio_base64,
                            "mime_type": "audio/pcm",
                            "sample_rate": self.config.audio_config.output_sample_rate,
                        },
                    )
                )

            except Exception as e:
                if self.is_active:
                    logger.error(f"Error processing audio output: {e}")
                break

    async def _send_websocket_message(self, message: WebSocketMessage):
        """Send message to WebSocket client."""
        try:
            await self.websocket.send_json(message.model_dump())
        except Exception as e:
            logger.error(f"Failed to send WebSocket message: {e}")


class GeminiLiveWebSocketService:
    """Service for managing Gemini Live WebSocket connections."""

    def __init__(self):
        """Initialize service."""
        self.session_manager = SessionManager()
        self._cleanup_task = None

    async def start_cleanup_task(self):
        """Start the periodic cleanup task."""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._periodic_cleanup())

    async def stop_cleanup_task(self):
        """Stop the periodic cleanup task."""
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass

    async def handle_websocket(self, websocket: WebSocket):
        """Handle WebSocket connection."""
        # Start cleanup task if not already running
        await self.start_cleanup_task()

        await websocket.accept()
        session = None

        try:
            # Wait for initial connection message
            data = await websocket.receive_json()
            message = WebSocketMessage(**data)

            if message.type != WebSocketMessageType.CONNECT:
                await self._send_error(websocket, "Expected CONNECT message")
                return

            # Create session
            connect_msg = ConnectMessage(**data)
            session = self.session_manager.create_session(websocket, connect_msg.data)

            # Start Gemini session
            await session.start_gemini_session()

            # Send session start confirmation
            await websocket.send_json(
                SessionStartMessage(
                    session_id=session.session_id,
                    timestamp=time.time(),
                    data={
                        "session_id": session.session_id,
                        "config": connect_msg.data.model_dump(),
                    },
                ).model_dump()
            )

            # Handle messages
            await self._handle_session_messages(session)

        except WebSocketDisconnect:
            logger.info("WebSocket disconnected")
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            await self._send_error(websocket, str(e))
        finally:
            # Cleanup
            if session:
                await session.stop_gemini_session()
                self.session_manager.remove_session(session.session_id)

    async def _handle_session_messages(self, session: LiveChatSession):
        """Handle messages for an active session."""
        while session.is_active:
            try:
                data = await session.websocket.receive_json()
                message = WebSocketMessage(**data)

                # Update activity
                session.update_activity()

                # Route message based on type
                if message.type == WebSocketMessageType.AUDIO_DATA:
                    await self._handle_audio_message(session, AudioMessage(**data))
                elif message.type == WebSocketMessageType.TEXT_MESSAGE:
                    await self._handle_text_message(session, TextMessage(**data))
                elif message.type == WebSocketMessageType.SCREEN_DATA:
                    await self._handle_screen_message(session, ScreenMessage(**data))
                elif message.type == WebSocketMessageType.CAMERA_DATA:
                    await self._handle_camera_message(session, CameraMessage(**data))
                elif message.type == WebSocketMessageType.DISCONNECT:
                    break

            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for session {session.session_id}")
                break
            except Exception as e:
                logger.error(f"Error handling session message: {e}")
                # Don't break the loop for message errors, just log and continue
                try:
                    await self._send_error(session.websocket, str(e))
                except Exception:
                    pass  # If we can't send error, connection might be broken

    async def _handle_audio_message(
        self, session: LiveChatSession, message: AudioMessage
    ):
        """Handle audio data message."""
        try:
            audio_data = base64.b64decode(message.data["audio"])
            await session.send_audio(
                audio_data, message.data.get("mime_type", "audio/pcm")
            )
        except Exception as e:
            logger.error(f"Error handling audio message: {e}")

    async def _handle_text_message(
        self, session: LiveChatSession, message: TextMessage
    ):
        """Handle text message."""
        try:
            await session.send_text(message.data["text"])
        except Exception as e:
            logger.error(f"Error handling text message: {e}")

    async def _handle_screen_message(
        self, session: LiveChatSession, message: ScreenMessage
    ):
        """Handle screen capture message."""
        try:
            await session.send_image(
                message.data["image"], message.data.get("mime_type", "image/jpeg")
            )
        except Exception as e:
            logger.error(f"Error handling screen message: {e}")

    async def _handle_camera_message(
        self, session: LiveChatSession, message: CameraMessage
    ):
        """Handle camera data message."""
        try:
            await session.send_image(
                message.data["image"], message.data.get("mime_type", "image/jpeg")
            )
        except Exception as e:
            logger.error(f"Error handling camera message: {e}")

    async def _send_error(self, websocket: WebSocket, error_message: str):
        """Send error message to WebSocket client."""
        try:
            error_msg = ErrorMessage(
                session_id="",
                timestamp=time.time(),
                data={"error": error_message, "code": "WEBSOCKET_ERROR"},
            )
            await websocket.send_json(error_msg.model_dump())
        except Exception:
            pass  # WebSocket might already be closed

    async def _periodic_cleanup(self):
        """Periodically clean up inactive sessions."""
        while True:
            try:
                await asyncio.sleep(60)  # Run every minute
                self.session_manager.cleanup_inactive_sessions()
            except Exception as e:
                logger.error(f"Error in periodic cleanup: {e}")

    def get_session_stats(self):
        """Get session statistics."""
        sessions = self.session_manager.get_all_sessions()
        total_sessions = len(sessions)

        # Count by chat mode
        voice_sessions = sum(
            1 for s in sessions.values() if s.config.chat_mode == ChatMode.VOICE
        )
        screen_sessions = sum(
            1 for s in sessions.values() if s.config.chat_mode == ChatMode.SCREEN
        )
        camera_sessions = sum(
            1 for s in sessions.values() if s.config.chat_mode == ChatMode.CAMERA
        )

        # Calculate average duration
        current_time = time.time()
        total_duration = sum(current_time - s.connected_at for s in sessions.values())
        avg_duration = total_duration / total_sessions if total_sessions > 0 else 0

        return {
            "total_sessions": total_sessions,
            "active_sessions": sum(1 for s in sessions.values() if s.is_active),
            "voice_sessions": voice_sessions,
            "screen_sessions": screen_sessions,
            "camera_sessions": camera_sessions,
            "average_session_duration": avg_duration,
        }
