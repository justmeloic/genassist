import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from google.api_core import exceptions
from loguru import logger

from src.app.schemas.text2video import Text2VideoRequest, Text2VideoResponse
from src.app.services.text2video_service import Text2VideoService

router = APIRouter()
service = Text2VideoService()


@router.post("/generate", response_model=Text2VideoResponse)
async def generate_video(request: Text2VideoRequest):
    """Generate video from text prompt."""
    try:
        logger.info("Generating video for prompt: %s", request.prompt)
        file_path = await service.generate_video(
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio,
            person_generation=request.person_generation,
        )
        logger.info("Successfully generated video: %s", file_path)
        return Text2VideoResponse(file_path=file_path, status="success")

    except exceptions.ResourceExhausted as e:
        logger.warning("Rate limit exceeded for video generation: %s", e)
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. You have sent too many requests. Please try again later.",
        )

    except exceptions.GoogleAPICallError as e:
        logger.error("Video generation service API error: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"The video generation service returned an error. Please try again.",
        )

    except Exception as e:
        logger.error("Unexpected error during video generation: %s", e)
        error_str = str(e)
        if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please check your plan or try again later.",
            )

        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {e}"
        )


@router.get("/download/{filename}")
async def download_video(filename: str):
    """Download generated video file."""
    try:
        file_path = os.path.join(service.output_dir, filename)
        if not os.path.exists(file_path):
            logger.warning("Video file not found: %s", file_path)
            raise HTTPException(status_code=404, detail="File not found")

        return FileResponse(file_path)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Video download failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Video download failed: {str(e)}",
        )
