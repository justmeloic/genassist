import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from google.api_core import exceptions

from src.app.schemas.text2image import Text2ImageRequest, Text2ImageResponse
from src.app.services.text2image_service import Text2ImageService

router = APIRouter()
service = Text2ImageService()


@router.post("/generate", response_model=Text2ImageResponse)
async def generate_images(request: Text2ImageRequest):
    """Generate images from text prompt."""
    try:
        file_paths = await service.generate_images(
            prompt=request.prompt,
            num_images=request.num_images,
        )
        return Text2ImageResponse(file_paths=file_paths, status="success")

    except exceptions.ResourceExhausted as e:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later.",
        )

    except exceptions.GoogleAPICallError as e:
        raise HTTPException(
            status_code=502,
            detail=f"The image generation service returned an error: {e}",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {e}"
        )


@router.get("/download/{filename}")
async def download_image(filename: str):
    """Download generated image file."""
    file_path = os.path.join(service.output_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, media_type="image/png")
