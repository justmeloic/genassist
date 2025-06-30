"""Tests for custom exceptions."""

import pytest

from src.app.utils.exceptions import (
    DocumentEditException,
    GeminiAPIException,
    ServiceException,
    Text2SpeechException,
    ValidationException,
)


@pytest.mark.unit
def test_service_exception():
    """Test base ServiceException."""
    message = "Test error message"
    details = {"error_code": "TEST_001", "field": "test_field"}

    exc = ServiceException(message, details)

    assert str(exc) == message
    assert exc.message == message
    assert exc.details == details


@pytest.mark.unit
def test_service_exception_without_details():
    """Test ServiceException without details."""
    message = "Test error message"

    exc = ServiceException(message)

    assert str(exc) == message
    assert exc.message == message
    assert exc.details == {}


@pytest.mark.unit
def test_gemini_api_exception_inheritance():
    """Test that GeminiAPIException inherits from ServiceException."""
    message = "Gemini API error"
    details = {"api_error": "INVALID_REQUEST"}

    exc = GeminiAPIException(message, details)

    assert isinstance(exc, ServiceException)
    assert str(exc) == message
    assert exc.message == message
    assert exc.details == details


@pytest.mark.unit
def test_document_edit_exception_inheritance():
    """Test that DocumentEditException inherits from ServiceException."""
    message = "Document edit error"

    exc = DocumentEditException(message)

    assert isinstance(exc, ServiceException)
    assert str(exc) == message
    assert exc.message == message
    assert exc.details == {}


@pytest.mark.unit
def test_text2speech_exception_inheritance():
    """Test that Text2SpeechException inherits from ServiceException."""
    message = "TTS error"
    details = {"voice": "invalid_voice"}

    exc = Text2SpeechException(message, details)

    assert isinstance(exc, ServiceException)
    assert str(exc) == message
    assert exc.message == message
    assert exc.details == details


@pytest.mark.unit
def test_validation_exception_inheritance():
    """Test that ValidationException inherits from ServiceException."""
    message = "Validation error"
    details = {"field": "text", "error": "too_long"}

    exc = ValidationException(message, details)

    assert isinstance(exc, ServiceException)
    assert str(exc) == message
    assert exc.message == message
    assert exc.details == details


@pytest.mark.unit
def test_exception_raising():
    """Test that exceptions can be raised and caught properly."""
    with pytest.raises(ServiceException) as exc_info:
        raise ServiceException("Test exception")

    assert str(exc_info.value) == "Test exception"


@pytest.mark.unit
def test_exception_chaining():
    """Test exception chaining."""
    original = ValueError("Original error")

    try:
        raise original
    except ValueError as e:
        service_exc = ServiceException("Service error", {"original": str(e)})
        service_exc.__cause__ = e

        with pytest.raises(ServiceException) as exc_info:
            raise service_exc

        assert str(exc_info.value) == "Service error"
        assert exc_info.value.details["original"] == "Original error"


@pytest.mark.unit
def test_all_exception_types():
    """Test all exception types can be instantiated."""
    exceptions = [
        ServiceException,
        GeminiAPIException,
        DocumentEditException,
        Text2SpeechException,
        ValidationException,
    ]

    for exc_class in exceptions:
        exc = exc_class("test message", {"test": "data"})
        assert isinstance(exc, ServiceException)
        assert exc.message == "test message"
        assert exc.details == {"test": "data"}
