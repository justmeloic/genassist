"""Main API router for v1."""

from fastapi import APIRouter

from src.app.api.v1.routes import (
    auth,
    document_edit,
    gemini_live,
    text2image,
    text2speech,
    text2video,
)

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

api_router.include_router(
    text2image.router, prefix="/text2image", tags=["text-to-image"]
)

api_router.include_router(
    gemini_live.router, prefix="/gemini-live", tags=["gemini-live"]
)

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
