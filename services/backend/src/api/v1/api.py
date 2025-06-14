"""Main API router for v1."""

from fastapi import APIRouter

from src.api.v1.endpoints import document_edit, text2speech, text2video

api_router = APIRouter()

api_router.include_router(
    document_edit.router, prefix="/documentedit", tags=["document-edit"]
)

api_router.include_router(
    text2speech.router, prefix="/text2speech", tags=["text-to-speech"]
)

api_router.include_router(
    text2video.router, prefix="/text2video", tags=["text-to-video"]
)
