"""FastAPI dependencies."""

from functools import lru_cache

from app.services.document_edit_service import DocumentEditService
from app.services.text2speech_service import Text2SpeechService


@lru_cache()
def get_document_edit_service() -> DocumentEditService:
    """Get document edit service instance."""
    return DocumentEditService()


@lru_cache()
def get_text2speech_service() -> Text2SpeechService:
    """Get text-to-speech service instance."""
    return Text2SpeechService()
