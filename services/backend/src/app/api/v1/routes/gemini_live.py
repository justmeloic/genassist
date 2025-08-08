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

"""WebSocket routes for Gemini Live API."""

from fastapi import APIRouter, Depends, WebSocket
from loguru import logger

from src.app.schemas.gemini_live_web import (
    ActiveSessionsResponse,
    SessionInfo,
    SessionStatsResponse,
)
from src.app.services.gemini_live_web_service import GeminiLiveWebSocketService
from src.app.utils.dependencies import get_gemini_live_websocket_service

router = APIRouter()


@router.websocket("/voice-chat")
async def voice_chat_websocket(
    websocket: WebSocket,
    service: GeminiLiveWebSocketService = Depends(get_gemini_live_websocket_service),
):
    """WebSocket endpoint for voice-only chat with Gemini Live API."""
    logger.info("New voice chat WebSocket connection")
    await service.handle_websocket(websocket)


@router.websocket("/screen-share")
async def screen_share_websocket(
    websocket: WebSocket,
    service: GeminiLiveWebSocketService = Depends(get_gemini_live_websocket_service),
):
    """WebSocket endpoint for screen sharing + voice chat with Gemini Live API."""
    logger.info("New screen share WebSocket connection")
    await service.handle_websocket(websocket)


@router.websocket("/camera-chat")
async def camera_chat_websocket(
    websocket: WebSocket,
    service: GeminiLiveWebSocketService = Depends(get_gemini_live_websocket_service),
):
    """WebSocket endpoint for camera + voice chat with Gemini Live API."""
    logger.info("New camera chat WebSocket connection")
    await service.handle_websocket(websocket)


@router.get("/sessions", response_model=ActiveSessionsResponse)
async def get_active_sessions(
    service: GeminiLiveWebSocketService = Depends(get_gemini_live_websocket_service),
):
    """Get list of active sessions."""
    try:
        sessions = service.session_manager.get_all_sessions()

        session_info = []
        for session_id, session in sessions.items():
            session_info.append(
                SessionInfo(
                    session_id=session_id,
                    chat_mode=session.config.chat_mode,
                    voice_name=session.config.voice_name,
                    connected_at=session.connected_at,
                    last_activity=session.last_activity,
                    is_active=session.is_active,
                )
            )

        return ActiveSessionsResponse(
            sessions=session_info, total_count=len(session_info)
        )

    except Exception as e:
        logger.error(f"Failed to get active sessions: {e}")
        raise


@router.get("/stats", response_model=SessionStatsResponse)
async def get_session_stats(
    service: GeminiLiveWebSocketService = Depends(get_gemini_live_websocket_service),
):
    """Get session statistics."""
    try:
        stats = service.get_session_stats()
        return SessionStatsResponse(**stats)

    except Exception as e:
        logger.error(f"Failed to get session stats: {e}")
        raise


@router.delete("/sessions/{session_id}")
async def terminate_session(
    session_id: str,
    service: GeminiLiveWebSocketService = Depends(get_gemini_live_websocket_service),
):
    """Terminate a specific session."""
    try:
        session = service.session_manager.get_session(session_id)
        if not session:
            return {"error": "Session not found", "session_id": session_id}

        await session.stop_gemini_session()
        service.session_manager.remove_session(session_id)

        logger.info(f"Manually terminated session {session_id}")
        return {"message": "Session terminated", "session_id": session_id}

    except Exception as e:
        logger.error(f"Failed to terminate session {session_id}: {e}")
        raise


@router.get("/voices")
async def get_available_voices():
    """Get list of available AI voices."""
    from src.app.schemas.gemini_live import VoiceName

    voices = [
        {
            "id": voice.value,
            "name": voice.value.title(),
            "description": f"{voice.value.title()} voice option",
        }
        for voice in VoiceName
    ]

    return {"voices": voices}


@router.get("/health")
async def websocket_health_check(
    service: GeminiLiveWebSocketService = Depends(get_gemini_live_websocket_service),
):
    """Health check for WebSocket service."""
    try:
        stats = service.get_session_stats()
        return {
            "status": "healthy",
            "active_sessions": stats["active_sessions"],
            "total_sessions": stats["total_sessions"],
        }
    except Exception as e:
        logger.error(f"WebSocket health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}
