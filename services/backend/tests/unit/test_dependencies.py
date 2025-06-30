"""Tests for service dependencies."""

import pytest

from src.app.services.document_edit_service import DocumentEditService
from src.app.services.text2image_service import Text2ImageService
from src.app.services.text2speech_service import Text2SpeechService
from src.app.services.text2video_service import Text2VideoService
from src.app.utils.dependencies import (
    get_document_edit_service,
    get_text2image_service,
    get_text2speech_service,
    get_text2video_service,
    get_tts_service,
)


@pytest.mark.unit
def test_get_document_edit_service():
    """Test document edit service dependency."""
    service = get_document_edit_service()
    assert isinstance(service, DocumentEditService)

    # Test singleton behavior
    service2 = get_document_edit_service()
    assert service is service2


@pytest.mark.unit
def test_get_text2speech_service():
    """Test text-to-speech service dependency."""
    service = get_text2speech_service()
    assert isinstance(service, Text2SpeechService)

    # Test singleton behavior
    service2 = get_text2speech_service()
    assert service is service2


@pytest.mark.unit
def test_get_text2image_service():
    """Test text-to-image service dependency."""
    service = get_text2image_service()
    assert isinstance(service, Text2ImageService)

    # Test singleton behavior
    service2 = get_text2image_service()
    assert service is service2


@pytest.mark.unit
def test_get_text2video_service():
    """Test text-to-video service dependency."""
    service = get_text2video_service()
    assert isinstance(service, Text2VideoService)

    # Test singleton behavior
    service2 = get_text2video_service()
    assert service is service2


@pytest.mark.unit
def test_get_tts_service_alias():
    """Test TTS service alias dependency."""
    service = get_tts_service()
    assert isinstance(service, Text2SpeechService)

    # Test that it's the same instance as get_text2speech_service
    tts_service = get_text2speech_service()
    assert service is tts_service


@pytest.mark.unit
def test_dependency_caching():
    """Test that dependencies are properly cached."""
    # Clear any existing cache
    get_document_edit_service.cache_clear()
    get_text2speech_service.cache_clear()
    get_text2image_service.cache_clear()
    get_text2video_service.cache_clear()
    get_tts_service.cache_clear()

    # Get services multiple times
    doc_service1 = get_document_edit_service()
    doc_service2 = get_document_edit_service()

    tts_service1 = get_text2speech_service()
    tts_service2 = get_text2speech_service()

    image_service1 = get_text2image_service()
    image_service2 = get_text2image_service()

    video_service1 = get_text2video_service()
    video_service2 = get_text2video_service()

    # Should be the same instances
    assert doc_service1 is doc_service2
    assert tts_service1 is tts_service2
    assert image_service1 is image_service2
    assert video_service1 is video_service2


@pytest.mark.unit
def test_dependency_cache_info():
    """Test dependency cache information."""
    # Clear cache
    get_document_edit_service.cache_clear()

    # Check initial state
    info = get_document_edit_service.cache_info()
    assert info.hits == 0
    assert info.misses == 0

    # Call service
    get_document_edit_service()
    info = get_document_edit_service.cache_info()
    assert info.misses == 1

    # Call again (should be cached)
    get_document_edit_service()
    info = get_document_edit_service.cache_info()
    assert info.hits == 1


@pytest.mark.unit
def test_all_dependencies_are_different_instances():
    """Test that different service dependencies return different instances."""
    doc_service = get_document_edit_service()
    tts_service = get_text2speech_service()
    image_service = get_text2image_service()
    video_service = get_text2video_service()

    # All should be different objects
    services = [doc_service, tts_service, image_service, video_service]
    for i, service1 in enumerate(services):
        for j, service2 in enumerate(services):
            if i != j:
                assert service1 is not service2
                assert not isinstance(service1, type(service2))
