# File: src/api/v1/endpoints/text2video.py

import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

# Import the specific exceptions from the Google library
from google.api_core import exceptions

from src.app.schemas.text2video import Text2VideoRequest, Text2VideoResponse
from src.app.services.text2video_service import Text2VideoService

router = APIRouter()
service = Text2VideoService()


@router.post("/generate", response_model=Text2VideoResponse)
async def generate_video(request: Text2VideoRequest):
    """Generate video from text prompt."""
    try:
        file_path = await service.generate_video(
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio,
            person_generation=request.person_generation,
        )
        return Text2VideoResponse(file_path=file_path, status="success")

    # Specifically catch the rate limit error
    except exceptions.ResourceExhausted as e:
        print(f"RATE LIMIT HIT: {e}")
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. You have sent too many requests. Please try again later.",
        )

    # Catch other potential Google API errors
    except exceptions.GoogleAPICallError as e:
        print(f"GOOGLE API ERROR: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"The video generation service returned an error. Please try again.",
        )

    # Catch any other unexpected server-side errors
    except Exception as e:
        # --- THIS IS THE CRUCIAL DEBUGGING STEP ---
        # We need to see the exact type of exception to handle it properly.
        print(f"CAUGHT UNEXPECTED EXCEPTION TYPE: {type(e)}")
        print(f"UNEXPECTED SERVER ERROR: {e}")
        # ---

        # For now, we will inspect the string to provide a better temporary error
        error_str = str(e)
        if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please check your plan or try again later.",
            )

        raise HTTPException(
            status_code=500, detail="An unexpected error occurred on the server."
        )


@router.get("/download/{filename}")
async def download_video(filename: str):
    """Download generated video file."""
    file_path = os.path.join(service.output_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path)
