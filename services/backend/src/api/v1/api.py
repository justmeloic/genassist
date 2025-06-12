"""Main API router for v1."""

from fastapi import APIRouter

from src.api.v1.endpoints import document_edit, text2speech

api_router = APIRouter()

api_router.include_router(
    document_edit.router, prefix="/documentedit", tags=["document-edit"]
)

api_router.include_router(
    text2speech.router, prefix="/text2speech", tags=["text-to-speech"]
)
