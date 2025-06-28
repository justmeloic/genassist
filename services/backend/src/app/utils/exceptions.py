"""Custom exception classes."""

from typing import Any, Dict, Optional


class ServiceException(Exception):
    """Base service exception."""

    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class GeminiAPIException(ServiceException):
    """Gemini API related exception."""

    pass


class DocumentEditException(ServiceException):
    """Document editing related exception."""

    pass


class Text2SpeechException(ServiceException):
    """Text-to-speech related exception."""

    pass


class ValidationException(ServiceException):
    """Validation related exception."""

    pass
