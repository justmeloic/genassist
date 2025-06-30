"""Tests for Pydantic schemas."""

import pytest
from pydantic import ValidationError

from src.app.models.document_edit import DocumentType
from src.app.models.text2speech import SpeechPitch, SpeechSpeed, VoiceName
from src.app.schemas.document_edit import DocumentEditRequest, DocumentEditResponse
from src.app.schemas.text2image import Text2ImageRequest, Text2ImageResponse
from src.app.schemas.text2speech import (
    SpeakerConfig,
    Text2SpeechRequest,
    Text2SpeechResponse,
)
from src.app.schemas.text2video import Text2VideoRequest, Text2VideoResponse


class TestDocumentEditSchemas:
    """Tests for document edit schemas."""

    @pytest.mark.unit
    def test_document_edit_request_valid(self):
        """Test valid document edit request."""
        data = {
            "content": "This is test content.",
            "instructions": "Fix grammar and improve style.",
            "document_type": DocumentType.GENERAL,
            "additional_context": "This is a business document.",
        }

        request = DocumentEditRequest(**data)
        assert request.content == "This is test content."
        assert request.instructions == "Fix grammar and improve style."
        assert request.document_type == DocumentType.GENERAL
        assert request.additional_context == "This is a business document."

    @pytest.mark.unit
    def test_document_edit_request_minimal(self):
        """Test minimal document edit request."""
        data = {"content": "Test content", "instructions": "Test instructions"}

        request = DocumentEditRequest(**data)
        assert request.content == "Test content"
        assert request.instructions == "Test instructions"
        assert request.document_type == DocumentType.GENERAL
        assert request.additional_context is None

    @pytest.mark.unit
    def test_document_edit_request_validation_errors(self):
        """Test document edit request validation errors."""
        # Empty content
        with pytest.raises(ValidationError) as exc_info:
            DocumentEditRequest(content="", instructions="test")
        assert "Content cannot be empty" in str(exc_info.value)

        # Empty instructions
        with pytest.raises(ValidationError) as exc_info:
            DocumentEditRequest(content="test", instructions="")
        assert "Instructions cannot be empty" in str(exc_info.value)

        # Whitespace only content
        with pytest.raises(ValidationError) as exc_info:
            DocumentEditRequest(content="   ", instructions="test")
        assert "Content cannot be empty" in str(exc_info.value)

    @pytest.mark.unit
    def test_document_edit_response(self):
        """Test document edit response."""
        data = {
            "edited_content": "Edited content",
            "original_length": 100,
            "edited_length": 120,
            "status": "success",
        }

        response = DocumentEditResponse(**data)
        assert response.edited_content == "Edited content"
        assert response.original_length == 100
        assert response.edited_length == 120
        assert response.status == "success"


class TestText2SpeechSchemas:
    """Tests for text-to-speech schemas."""

    @pytest.mark.unit
    def test_speaker_config(self):
        """Test speaker configuration."""
        config = SpeakerConfig(speaker="Joe", voice_name=VoiceName.ALG)
        assert config.speaker == "Joe"
        assert config.voice_name == VoiceName.ALG

    @pytest.mark.unit
    def test_text2speech_request_single_speaker(self):
        """Test single speaker TTS request."""
        data = {
            "text": "Hello, world!",
            "is_multi_speaker": False,
            "voice_name": VoiceName.KORE,
            "speed": SpeechSpeed.NORMAL,
            "pitch": SpeechPitch.NORMAL,
        }

        request = Text2SpeechRequest(**data)
        assert request.text == "Hello, world!"
        assert request.is_multi_speaker is False
        assert request.voice_name == VoiceName.KORE
        assert request.speakers is None

    @pytest.mark.unit
    def test_text2speech_request_multi_speaker_with_defaults(self):
        """Test multi-speaker TTS request using defaults."""
        data = {"text": "Joe: Hello! Jane: Hi there!", "is_multi_speaker": True}

        request = Text2SpeechRequest(**data)
        assert request.is_multi_speaker is True
        assert request.speakers is not None
        assert len(request.speakers) == 2
        assert request.speakers[0].speaker == "Joe"
        assert request.speakers[1].speaker == "Jane"

    @pytest.mark.unit
    def test_text2speech_request_multi_speaker_custom(self):
        """Test multi-speaker TTS request with custom speakers."""
        speakers = [
            SpeakerConfig(speaker="Alice", voice_name=VoiceName.KORE),
            SpeakerConfig(speaker="Bob", voice_name=VoiceName.ALG),
        ]

        data = {
            "text": "Alice: Hello! Bob: Hi!",
            "is_multi_speaker": True,
            "speakers": speakers,
        }

        request = Text2SpeechRequest(**data)
        assert request.is_multi_speaker is True
        assert len(request.speakers) == 2
        assert request.speakers[0].speaker == "Alice"
        assert request.speakers[1].speaker == "Bob"

    @pytest.mark.unit
    def test_text2speech_request_validation_error(self):
        """Test TTS request validation errors."""
        # Speakers provided for single-speaker mode
        with pytest.raises(ValidationError) as exc_info:
            Text2SpeechRequest(
                text="Hello",
                is_multi_speaker=False,
                speakers=[SpeakerConfig(speaker="Joe", voice_name=VoiceName.KORE)],
            )
        assert "Speakers should not be provided for single-speaker TTS" in str(
            exc_info.value
        )

    @pytest.mark.unit
    def test_text2speech_response(self):
        """Test TTS response."""
        data = {
            "audio_file_id": "123e4567-e89b-12d3-a456-426614174000",
            "filename": "audio.wav",
            "file_path": "/path/to/audio.wav",
            "duration_seconds": 5.5,
            "file_size_bytes": 132000,
            "status": "success",
        }

        response = Text2SpeechResponse(**data)
        assert response.audio_file_id == "123e4567-e89b-12d3-a456-426614174000"
        assert response.filename == "audio.wav"
        assert response.duration_seconds == 5.5


class TestText2ImageSchemas:
    """Tests for text-to-image schemas."""

    @pytest.mark.unit
    def test_text2image_request(self):
        """Test text-to-image request."""
        data = {"prompt": "A beautiful sunset over mountains", "num_images": 2}

        request = Text2ImageRequest(**data)
        assert request.prompt == "A beautiful sunset over mountains"
        assert request.num_images == 2

    @pytest.mark.unit
    def test_text2image_request_defaults(self):
        """Test text-to-image request with defaults."""
        request = Text2ImageRequest(prompt="Test image")
        assert request.prompt == "Test image"
        assert request.num_images == 4  # Default value

    @pytest.mark.unit
    def test_text2image_response(self):
        """Test text-to-image response."""
        data = {"file_paths": ["image1.png", "image2.png"], "status": "success"}

        response = Text2ImageResponse(**data)
        assert response.file_paths == ["image1.png", "image2.png"]
        assert response.status == "success"


class TestText2VideoSchemas:
    """Tests for text-to-video schemas."""

    @pytest.mark.unit
    def test_text2video_request(self):
        """Test text-to-video request."""
        data = {
            "prompt": "A cat playing with a ball",
            "aspect_ratio": "4:3",
            "person_generation": "allow_adult",
        }

        request = Text2VideoRequest(**data)
        assert request.prompt == "A cat playing with a ball"
        assert request.aspect_ratio == "4:3"
        assert request.person_generation == "allow_adult"

    @pytest.mark.unit
    def test_text2video_request_defaults(self):
        """Test text-to-video request with defaults."""
        request = Text2VideoRequest(prompt="Test video")
        assert request.prompt == "Test video"
        assert request.aspect_ratio == "16:9"
        assert request.person_generation == "allow_adult"

    @pytest.mark.unit
    def test_text2video_response(self):
        """Test text-to-video response."""
        data = {"file_path": "video.mp4", "status": "success"}

        response = Text2VideoResponse(**data)
        assert response.file_path == "video.mp4"
        assert response.status == "success"


class TestSchemaValidation:
    """Test schema validation edge cases."""

    @pytest.mark.unit
    def test_text_length_validation(self):
        """Test text length validation."""
        # Very long text for TTS
        long_text = "A" * 50001
        with pytest.raises(ValidationError) as exc_info:
            Text2SpeechRequest(text=long_text)
        assert "String should have at most 50000 characters" in str(exc_info.value)

        # Very long content for document edit
        long_content = "A" * 100001
        with pytest.raises(ValidationError) as exc_info:
            DocumentEditRequest(content=long_content, instructions="test")
        assert "String should have at most 100000 characters" in str(exc_info.value)

    @pytest.mark.unit
    def test_required_fields(self):
        """Test required field validation."""
        # Missing required fields
        with pytest.raises(ValidationError) as exc_info:
            Text2SpeechRequest()
        assert "Field required" in str(exc_info.value)

        with pytest.raises(ValidationError) as exc_info:
            DocumentEditRequest(content="test")
        assert "Field required" in str(exc_info.value)
