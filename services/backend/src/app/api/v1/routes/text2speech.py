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

"""Text-to-speech endpoint."""

import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from loguru import logger

from src.app.core.config import settings
from src.app.schemas.text2speech import (
    Text2SpeechRequest,
    Text2SpeechResponse,
)
from src.app.services.text2speech_service import Text2SpeechService
from src.app.utils.dependencies import get_text2speech_service

router = APIRouter()


@router.post("/", response_model=Text2SpeechResponse)
async def generate_speech(
    request: Text2SpeechRequest,
    service: Text2SpeechService = Depends(get_text2speech_service),
) -> Text2SpeechResponse:
    """
    Generate speech from text using Gemini AI.

    Args:
        request: Text-to-speech request containing text and voice configuration
        service: Text-to-speech service dependency

    Returns:
        Text2SpeechResponse: Generated audio file information

    Raises:
        HTTPException: If speech generation fails
    """
    try:
        logger.info(
            "Processing text-to-speech request with %s characters", len(request.text)
        )

        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}.wav"

        # Generate speech
        audio_data = await service.generate_speech(
            text=request.text,
            is_multi_speaker=request.is_multi_speaker,
            voice_name=request.voice_name,
            speakers=request.speakers,
            speed=request.speed,
            pitch=request.pitch,
        )

        # Ensure output directory exists
        os.makedirs(settings.AUDIO_OUTPUT_DIR, exist_ok=True)

        # Save audio file
        file_path = os.path.join(settings.AUDIO_OUTPUT_DIR, filename)
        await service.save_audio_file(audio_data, file_path)

        logger.info("Speech generation completed successfully: %s", filename)

        return Text2SpeechResponse(
            audio_file_id=file_id,
            filename=filename,
            file_path=file_path,
            duration_seconds=len(audio_data)
            / (settings.AUDIO_SAMPLE_RATE * settings.AUDIO_SAMPLE_WIDTH),
            file_size_bytes=len(audio_data),
            status="success",
        )

    except Exception as e:
        logger.error("Speech generation failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech generation failed: {str(e)}",
        )


@router.get("/download/{file_id}")
async def download_audio(file_id: str):
    """
    Download generated audio file.

    Args:
        file_id: Unique file identifier

    Returns:
        FileResponse: Audio file

    Raises:
        HTTPException: If file not found
    """
    try:
        filename = f"{file_id}.wav"
        file_path = os.path.join(settings.AUDIO_OUTPUT_DIR, filename)

        if not os.path.exists(file_path):
            logger.warning("Audio file not found: %s", file_path)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio file not found",
            )

        return FileResponse(
            path=file_path,
            media_type="audio/wav",
            filename=filename,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Audio download failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio download failed: {str(e)}",
        )


@router.get("/speakers")
async def get_available_speakers():
    """
    Get list of available speakers.

    Returns:
        Dict containing list of available speakers
    """
    try:
        # For now, return a mock list of speakers
        # In a real implementation, this would come from the TTS service
        speakers = [
            {"id": "joe", "name": "Joe", "language": "en-US", "gender": "male"},
            {"id": "jane", "name": "Jane", "language": "en-US", "gender": "female"},
            {"id": "alex", "name": "Alex", "language": "en-US", "gender": "neutral"},
        ]

        return {"speakers": speakers}

    except Exception as e:
        logger.error("Failed to get speakers: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get speakers: {str(e)}",
        )


@router.get("/speakers/{speaker_id}")
async def get_speaker_details(speaker_id: str):
    """
    Get details for a specific speaker.

    Args:
        speaker_id: ID of the speaker

    Returns:
        Dict containing speaker details
    """
    try:
        # Mock speaker details - in real implementation would come from TTS service
        speaker_details = {
            "joe": {
                "speaker": "joe",
                "voice_name": "Joe",
                "language_code": "en-US",
                "gender": "male",
            },
            "jane": {
                "speaker": "jane",
                "voice_name": "Jane",
                "language_code": "en-US",
                "gender": "female",
            },
            "alex": {
                "speaker": "alex",
                "voice_name": "Alex",
                "language_code": "en-US",
                "gender": "neutral",
            },
        }

        if speaker_id not in speaker_details:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Speaker not found",
            )

        return speaker_details[speaker_id]

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get speaker details: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get speaker details: {str(e)}",
        )
