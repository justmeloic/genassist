"""Unit tests for service classes."""

import os
import tempfile
from unittest.mock import Mock, patch

import pytest

from src.app.models.document_edit import DocumentType
from src.app.models.text2speech import SpeechPitch, SpeechSpeed, VoiceName
from src.app.services.document_edit_service import DocumentEditService
from src.app.services.text2image_service import ImageGenerationError, Text2ImageService
from src.app.services.text2speech_service import Text2SpeechService
from src.app.services.text2video_service import Text2VideoService, VideoGenerationError


class TestDocumentEditService:
    """Test DocumentEditService."""

    @pytest.fixture
    def service(self):
        """Create DocumentEditService instance."""
        return DocumentEditService()

    @pytest.mark.unit
    def test_build_edit_prompt(self, service: DocumentEditService):
        """Test prompt building."""
        content = "Test document content"
        instructions = "Fix grammar"
        document_type = DocumentType.BUSINESS
        additional_context = "Client document"

        prompt = service._build_edit_prompt(
            content=content,
            instructions=instructions,
            document_type=document_type,
            additional_context=additional_context,
        )

        assert "business documents" in prompt.lower()
        assert "Fix grammar" in prompt
        assert "Test document content" in prompt
        assert "Client document" in prompt

    @pytest.mark.unit
    def test_build_edit_prompt_without_context(self, service: DocumentEditService):
        """Test prompt building without additional context."""
        content = "Test content"
        instructions = "Edit this"
        document_type = DocumentType.GENERAL

        prompt = service._build_edit_prompt(
            content=content, instructions=instructions, document_type=document_type
        )

        assert "Test content" in prompt
        assert "Edit this" in prompt
        assert "Additional context" not in prompt

    @pytest.mark.unit
    async def test_edit_document_success(self, service: DocumentEditService):
        """Test successful document editing."""
        with patch.object(service, "gemini_service") as mock_gemini:
            # Mock the response structure
            mock_response = Mock()
            mock_candidate = Mock()
            mock_content = Mock()
            mock_part = Mock()
            mock_part.text = "Edited document content"
            mock_content.parts = [mock_part]
            mock_candidate.content = mock_content
            mock_response.candidates = [mock_candidate]

            mock_gemini.generate_content.return_value = mock_response

            result = await service.edit_document(
                content="Original content",
                instructions="Edit this",
                document_type=DocumentType.GENERAL,
            )

            assert result == "Edited document content"
            mock_gemini.generate_content.assert_called_once()

    @pytest.mark.unit
    async def test_edit_document_error(self, service: DocumentEditService):
        """Test document editing error handling."""
        with patch.object(service, "gemini_service") as mock_gemini:
            mock_gemini.generate_content.side_effect = Exception("API error")

            with pytest.raises(Exception) as exc_info:
                await service.edit_document(
                    content="Test content", instructions="Edit this"
                )

            assert "Document editing failed" in str(exc_info.value)


class TestText2SpeechService:
    """Test Text2SpeechService."""

    @pytest.fixture
    def service(self):
        """Create Text2SpeechService instance."""
        with patch("os.makedirs"):
            return Text2SpeechService()

    @pytest.mark.unit
    def test_create_speech_config(self, service: Text2SpeechService):
        """Test speech configuration creation."""
        config = service._create_speech_config(
            voice_name=VoiceName.KORE,
            speed=SpeechSpeed.NORMAL,
            pitch=SpeechPitch.NORMAL,
        )

        assert config.voice_config.prebuilt_voice_config.voice_name == "Kore"

    @pytest.mark.unit
    def test_format_multi_speaker_text(self, service: Text2SpeechService):
        """Test multi-speaker text formatting."""
        # Text without instruction prefix
        text = "Joe: Hello! Jane: Hi there!"
        formatted = service._format_multi_speaker_text(text)
        assert formatted.startswith("TTS the following conversation:")
        assert "Joe: Hello! Jane: Hi there!" in formatted

        # Text that already has instruction prefix
        text_with_prefix = "TTS the following conversation:\nJoe: Hello!"
        formatted = service._format_multi_speaker_text(text_with_prefix)
        assert formatted == text_with_prefix

    @pytest.mark.unit
    async def test_generate_speech_success(
        self, service: Text2SpeechService, mock_audio_data: bytes
    ):
        """Test successful speech generation."""
        with patch.object(service, "gemini_service") as mock_gemini:
            # Mock the response structure
            mock_response = Mock()
            mock_candidate = Mock()
            mock_content = Mock()
            mock_part = Mock()
            mock_inline_data = Mock()
            mock_inline_data.data = mock_audio_data
            mock_part.inline_data = mock_inline_data
            mock_content.parts = [mock_part]
            mock_candidate.content = mock_content
            mock_response.candidates = [mock_candidate]

            mock_gemini.generate_content.return_value = mock_response

            result = await service.generate_speech("Hello world")

            assert result == mock_audio_data
            mock_gemini.generate_content.assert_called_once()

    @pytest.mark.unit
    async def test_generate_speech_no_response(self, service: Text2SpeechService):
        """Test speech generation with no response."""
        with patch.object(service, "gemini_service") as mock_gemini:
            mock_gemini.generate_content.return_value = None

            with pytest.raises(Exception) as exc_info:
                await service.generate_speech("Hello world")

            assert "No response from Gemini API" in str(exc_info.value)

    @pytest.mark.unit
    async def test_save_audio_file(
        self, service: Text2SpeechService, mock_audio_data: bytes
    ):
        """Test audio file saving."""
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            file_path = tmp_file.name

        try:
            await service.save_audio_file(mock_audio_data, file_path)

            # Verify file was created and has content
            assert os.path.exists(file_path)
            assert os.path.getsize(file_path) > 0
        finally:
            if os.path.exists(file_path):
                os.unlink(file_path)

    @pytest.mark.unit
    async def test_save_audio_file_error(self, service: Text2SpeechService):
        """Test audio file saving with error."""
        with pytest.raises(Exception) as exc_info:
            await service.save_audio_file(b"test", "/invalid/path/file.wav")

        assert "Failed to save audio file" in str(exc_info.value)


class TestText2ImageService:
    """Test Text2ImageService."""

    @pytest.fixture
    def service(self):
        """Create Text2ImageService instance."""
        with patch("os.makedirs"):
            return Text2ImageService()

    @pytest.mark.unit
    async def test_generate_images_success(
        self, service: Text2ImageService, mock_image_data: bytes
    ):
        """Test successful image generation."""
        with patch.object(service, "client") as mock_client:
            # Mock the response structure
            mock_response = Mock()
            mock_generated_image = Mock()
            mock_image = Mock()
            mock_image.image_bytes = mock_image_data
            mock_generated_image.image = mock_image
            mock_response.generated_images = [
                mock_generated_image,
                mock_generated_image,
            ]

            mock_client.aio.models.generate_images.return_value = mock_response

            with (
                patch("PIL.Image.open") as mock_open,
                patch("PIL.Image.Image.save") as mock_save,
            ):
                mock_image_obj = Mock()
                mock_open.return_value = mock_image_obj

                result = await service.generate_images("Test prompt", 2)

                assert len(result) == 2
                assert all(filename.endswith(".png") for filename in result)
                assert mock_save.call_count == 2

    @pytest.mark.unit
    async def test_generate_images_no_images(self, service: Text2ImageService):
        """Test image generation with no images returned."""
        with patch.object(service, "client") as mock_client:
            mock_response = Mock()
            mock_response.generated_images = []
            mock_client.aio.models.generate_images.return_value = mock_response

            with pytest.raises(ImageGenerationError) as exc_info:
                await service.generate_images("Test prompt", 1)

            assert "API returned no images" in str(exc_info.value)

    @pytest.mark.unit
    async def test_generate_images_error(self, service: Text2ImageService):
        """Test image generation error handling."""
        with patch.object(service, "client") as mock_client:
            mock_client.aio.models.generate_images.side_effect = Exception("API error")

            with pytest.raises(ImageGenerationError) as exc_info:
                await service.generate_images("Test prompt", 1)

            assert "An unexpected error occurred" in str(exc_info.value)


class TestText2VideoService:
    """Test Text2VideoService."""

    @pytest.fixture
    def service(self):
        """Create Text2VideoService instance."""
        with patch("os.makedirs"):
            return Text2VideoService()

    @pytest.mark.unit
    async def test_generate_video_success(self, service: Text2VideoService):
        """Test successful video generation."""
        mock_video_data = b"fake video data"

        with (
            patch.object(service, "client") as mock_client,
            patch("aiohttp.ClientSession") as mock_session,
            patch("aiofiles.open") as mock_open,
            patch("asyncio.sleep"),
        ):
            # Mock the operation and response
            mock_operation = Mock()
            mock_operation.done = False
            mock_client.aio.models.generate_videos.return_value = mock_operation

            # Mock the get operation (after polling)
            mock_operation_complete = Mock()
            mock_operation_complete.done = True
            mock_response = Mock()
            mock_video = Mock()
            mock_video_file = Mock()
            mock_video_file.uri = "http://example.com/video.mp4"
            mock_video.video = mock_video_file
            mock_response.generated_videos = [mock_video]
            mock_operation_complete.response = mock_response
            mock_client.aio.operations.get.return_value = mock_operation_complete

            # Mock HTTP response
            mock_resp = Mock()
            mock_resp.read.return_value = mock_video_data
            mock_session.return_value.__aenter__.return_value.get.return_value.__aenter__.return_value = mock_resp

            # Mock file operations
            mock_file = Mock()
            mock_open.return_value.__aenter__.return_value = mock_file

            result = await service.generate_video("Test prompt", "16:9", "allow_adult")

            assert result.endswith(".mp4")
            mock_file.write.assert_called_once_with(mock_video_data)

    @pytest.mark.unit
    async def test_generate_video_no_response(self, service: Text2VideoService):
        """Test video generation with no response."""
        with patch.object(service, "client") as mock_client, patch("asyncio.sleep"):
            mock_operation = Mock()
            mock_operation.done = True
            mock_operation.response = None
            mock_client.aio.models.generate_videos.return_value = mock_operation

            with pytest.raises(VideoGenerationError) as exc_info:
                await service.generate_video("Test prompt", "16:9", "allow_adult")

            assert "No video generated by the API" in str(exc_info.value)

    @pytest.mark.unit
    async def test_generate_video_no_uri(self, service: Text2VideoService):
        """Test video generation with no download URI."""
        with patch.object(service, "client") as mock_client, patch("asyncio.sleep"):
            mock_operation = Mock()
            mock_operation.done = True
            mock_response = Mock()
            mock_video = Mock()
            mock_video.video = None
            mock_response.generated_videos = [mock_video]
            mock_operation.response = mock_response
            mock_client.aio.models.generate_videos.return_value = mock_operation

            with pytest.raises(VideoGenerationError) as exc_info:
                await service.generate_video("Test prompt", "16:9", "allow_adult")

            assert "No video download URI found" in str(exc_info.value)

    @pytest.mark.unit
    async def test_generate_video_error(self, service: Text2VideoService):
        """Test video generation error handling."""
        with patch.object(service, "client") as mock_client:
            mock_client.aio.models.generate_videos.side_effect = Exception("API error")

            with pytest.raises(VideoGenerationError) as exc_info:
                await service.generate_video("Test prompt", "16:9", "allow_adult")

            assert "An unexpected error occurred" in str(exc_info.value)
