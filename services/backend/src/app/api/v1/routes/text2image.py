"""
Defines API endpoints for text-to-image generation.

This module includes routes for generating images from a text prompt
and for downloading the generated image files.
"""

import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from google.api_core import exceptions
from loguru import logger

from src.app.schemas.text2image import Text2ImageRequest, Text2ImageResponse
from src.app.services.text2image_service import (
    ImageGenerationError,
    Text2ImageService,
)
from src.app.utils.dependencies import get_text2image_service

router = APIRouter()


@router.post("/generate", response_model=Text2ImageResponse)
async def generate_images(
    request: Text2ImageRequest,
    service: Text2ImageService = Depends(get_text2image_service),
):
    """Generate images from text prompt."""
    try:
        logger.info("Generating %d image(s) for prompt...", request.num_images)
        file_paths = await service.generate_images(
            prompt=request.prompt,
            num_images=request.num_images,
        )
        logger.info("Successfully generated images: %s", file_paths)
        return Text2ImageResponse(file_paths=file_paths, status="success")

    except ImageGenerationError as e:
        logger.error("Image generation failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
    except exceptions.ResourceExhausted as e:
        logger.warning("Rate limit exceeded for image generation: %s", e)
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later.",
        )

    except exceptions.GoogleAPICallError as e:
        logger.error("Image generation service API error: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"The image generation service returned an error: {e}",
        )

    except Exception as e:
        logger.error("Unexpected error during image generation: %s", e)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {e}"
        )


@router.get("/download/{filename}")
async def download_image(
    filename: str,
    service: Text2ImageService = Depends(get_text2image_service),
):
    """Download generated image file."""
    file_path = os.path.join(service.output_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, media_type="image/png")
