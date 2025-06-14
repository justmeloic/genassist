import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from src.schemas.text2video import Text2VideoRequest, Text2VideoResponse
from src.services.text2video_service import Text2VideoService

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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{filename}")
async def download_video(filename: str):
    """Download generated video file."""
    file_path = os.path.join(service.output_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path)
