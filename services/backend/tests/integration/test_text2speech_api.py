"""Integration tests for text-to-speech API endpoints."""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from src.app.models.text2speech import SpeechPitch, SpeechSpeed, VoiceName


@pytest.mark.api
def test_text2speech_endpoint_success(
    client: TestClient, sample_text: str, mock_audio_data: bytes
):
    """Test successful text-to-speech generation."""
    with (
        patch(
            "src.app.services.text2speech_service.Text2SpeechService.generate_speech"
        ) as mock_generate,
        patch(
            "src.app.services.text2speech_service.Text2SpeechService.save_audio_file"
        ) as mock_save,
        patch("os.makedirs"),
    ):
        mock_generate.return_value = mock_audio_data
        mock_save.return_value = None

        response = client.post(
            "/v1/api/text2speech/",
            json={
                "text": sample_text,
                "is_multi_speaker": False,
                "voice_name": VoiceName.KORE.value,
                "speed": SpeechSpeed.NORMAL.value,
                "pitch": SpeechPitch.NORMAL.value,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "audio_file_id" in data
        assert data["filename"].endswith(".wav")
        assert data["file_size_bytes"] > 0
        assert data["duration_seconds"] > 0


@pytest.mark.api
def test_text2speech_endpoint_minimal_request(
    client: TestClient, mock_audio_data: bytes
):
    """Test TTS with minimal request."""
    with (
        patch(
            "src.app.services.text2speech_service.Text2SpeechService.generate_speech"
        ) as mock_generate,
        patch(
            "src.app.services.text2speech_service.Text2SpeechService.save_audio_file"
        ) as mock_save,
        patch("os.makedirs"),
    ):
        mock_generate.return_value = mock_audio_data
        mock_save.return_value = None

        response = client.post("/v1/api/text2speech/", json={"text": "Hello world"})

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"


@pytest.mark.api
def test_text2speech_endpoint_multi_speaker(
    client: TestClient, sample_conversation: str, mock_audio_data: bytes
):
    """Test multi-speaker TTS."""
    with (
        patch(
            "src.app.services.text2speech_service.Text2SpeechService.generate_speech"
        ) as mock_generate,
        patch(
            "src.app.services.text2speech_service.Text2SpeechService.save_audio_file"
        ) as mock_save,
        patch("os.makedirs"),
    ):
        mock_generate.return_value = mock_audio_data
        mock_save.return_value = None

        response = client.post(
            "/v1/api/text2speech/",
            json={"text": sample_conversation, "is_multi_speaker": True},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"


@pytest.mark.api
def test_text2speech_endpoint_custom_speakers(
    client: TestClient, mock_audio_data: bytes
):
    """Test TTS with custom speakers."""
    with (
        patch(
            "src.app.services.text2speech_service.Text2SpeechService.generate_speech"
        ) as mock_generate,
        patch(
            "src.app.services.text2speech_service.Text2SpeechService.save_audio_file"
        ) as mock_save,
        patch("os.makedirs"),
    ):
        mock_generate.return_value = mock_audio_data
        mock_save.return_value = None

        speakers = [
            {"speaker": "Alice", "voice_name": VoiceName.KORE.value},
            {"speaker": "Bob", "voice_name": VoiceName.ALG.value},
        ]

        response = client.post(
            "/v1/api/text2speech/",
            json={
                "text": "Alice: Hello! Bob: Hi there!",
                "is_multi_speaker": True,
                "speakers": speakers,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"


@pytest.mark.api
def test_text2speech_endpoint_validation_errors(client: TestClient):
    """Test TTS validation errors."""
    # Missing text
    response = client.post("/v1/api/text2speech/", json={})
    assert response.status_code == 422

    # Empty text
    response = client.post("/v1/api/text2speech/", json={"text": ""})
    assert response.status_code == 422

    # Text too long
    long_text = "A" * 50001
    response = client.post("/v1/api/text2speech/", json={"text": long_text})
    assert response.status_code == 422

    # Invalid voice name
    response = client.post(
        "/v1/api/text2speech/", json={"text": "Hello", "voice_name": "InvalidVoice"}
    )
    assert response.status_code == 422

    # Speakers for single-speaker mode
    response = client.post(
        "/v1/api/text2speech/",
        json={
            "text": "Hello",
            "is_multi_speaker": False,
            "speakers": [{"speaker": "Joe", "voice_name": VoiceName.KORE.value}],
        },
    )
    assert response.status_code == 422


@pytest.mark.api
def test_text2speech_endpoint_service_error(client: TestClient):
    """Test TTS service error handling."""
    with patch(
        "src.app.services.text2speech_service.Text2SpeechService.generate_speech"
    ) as mock_generate:
        mock_generate.side_effect = Exception("TTS service error")

        response = client.post("/v1/api/text2speech/", json={"text": "Hello world"})

        assert response.status_code == 500
        data = response.json()
        assert "Speech generation failed" in data["detail"]


@pytest.mark.api
def test_download_audio_endpoint_success(client: TestClient, temp_file: str):
    """Test successful audio download."""
    # Create a mock audio file
    file_id = "test-file-id"

    with patch("os.path.join") as mock_join, patch("os.path.exists") as mock_exists:
        mock_join.return_value = temp_file
        mock_exists.return_value = True

        response = client.get(f"/v1/api/text2speech/download/{file_id}")

        assert response.status_code == 200
        assert response.headers["content-type"] == "audio/wav"


@pytest.mark.api
def test_download_audio_endpoint_file_not_found(client: TestClient):
    """Test audio download when file doesn't exist."""
    with patch("os.path.exists") as mock_exists:
        mock_exists.return_value = False

        response = client.get("/v1/api/text2speech/download/nonexistent-file")

        assert response.status_code == 404
        data = response.json()
        assert "Audio file not found" in data["detail"]


@pytest.mark.api
def test_download_audio_endpoint_server_error(client: TestClient):
    """Test audio download server error."""
    with patch("os.path.exists") as mock_exists:
        mock_exists.side_effect = Exception("File system error")

        response = client.get("/v1/api/text2speech/download/test-file")

        assert response.status_code == 500
        data = response.json()
        assert "Audio download failed" in data["detail"]


@pytest.mark.api
def test_get_available_speakers_endpoint(client: TestClient):
    """Test getting available speakers."""
    response = client.get("/v1/api/text2speech/speakers")

    assert response.status_code == 200
    data = response.json()
    assert "speakers" in data
    assert isinstance(data["speakers"], list)
    assert len(data["speakers"]) > 0

    # Check speaker structure
    speaker = data["speakers"][0]
    assert "id" in speaker
    assert "name" in speaker
    assert "language" in speaker
    assert "gender" in speaker


@pytest.mark.api
def test_get_speaker_details_endpoint(client: TestClient):
    """Test getting speaker details."""
    response = client.get("/v1/api/text2speech/speakers/joe")

    assert response.status_code == 200
    data = response.json()
    assert data["speaker"] == "joe"
    assert "voice_name" in data
    assert "language_code" in data
    assert "gender" in data


@pytest.mark.api
def test_get_speaker_details_not_found(client: TestClient):
    """Test getting details for non-existent speaker."""
    response = client.get("/v1/api/text2speech/speakers/nonexistent")

    assert response.status_code == 404
    data = response.json()
    assert "Speaker not found" in data["detail"]


@pytest.mark.api
def test_get_speakers_endpoint_error(client: TestClient):
    """Test speakers endpoint error handling."""
    with patch("src.app.api.v1.routes.text2speech.logger") as mock_logger:
        mock_logger.error.side_effect = Exception("Logging error")

        response = client.get("/v1/api/text2speech/speakers")
        # Should still work despite logging error
        assert response.status_code == 200


@pytest.mark.api
async def test_text2speech_endpoint_async(async_client, mock_audio_data: bytes):
    """Test TTS endpoint with async client."""
    with (
        patch(
            "src.app.services.text2speech_service.Text2SpeechService.generate_speech"
        ) as mock_generate,
        patch(
            "src.app.services.text2speech_service.Text2SpeechService.save_audio_file"
        ) as mock_save,
        patch("os.makedirs"),
    ):
        mock_generate.return_value = mock_audio_data
        mock_save.return_value = None

        response = await async_client.post(
            "/v1/api/text2speech/", json={"text": "Async test"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
