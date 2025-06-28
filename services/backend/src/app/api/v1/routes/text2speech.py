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
            f"Processing text-to-speech request with {len(request.text)} characters"
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
        os.makedirs(settings.OUTPUT_DIR, exist_ok=True)

        # Save audio file
        file_path = os.path.join(settings.OUTPUT_DIR, filename)
        await service.save_audio_file(audio_data, file_path)

        logger.info(f"Speech generation completed successfully: {filename}")

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
        logger.error(f"Speech generation failed: {str(e)}")
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
        file_path = os.path.join(settings.OUTPUT_DIR, filename)

        if not os.path.exists(file_path):
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
        logger.error(f"Audio download failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio download failed: {str(e)}",
        )
