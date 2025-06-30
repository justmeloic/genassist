"""Integration tests for text-to-video API endpoints."""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from src.app.services.text2video_service import VideoGenerationError


@pytest.mark.api
def test_text2video_generate_endpoint_success(client: TestClient):
    """Test successful video generation."""
    with patch(
        "src.app.services.text2video_service.Text2VideoService.generate_video"
    ) as mock_generate:
        mock_generate.return_value = "generated_video.mp4"

        response = client.post(
            "/v1/api/text2video/generate",
            json={
                "prompt": "A cat playing with a ball in a garden",
                "aspect_ratio": "16:9",
                "person_generation": "allow_adult",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["file_path"] == "generated_video.mp4"


@pytest.mark.api
def test_text2video_generate_endpoint_defaults(client: TestClient):
    """Test video generation with default parameters."""
    with patch(
        "src.app.services.text2video_service.Text2VideoService.generate_video"
    ) as mock_generate:
        mock_generate.return_value = "default_video.mp4"

        response = client.post(
            "/v1/api/text2video/generate", json={"prompt": "A simple test video"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["file_path"] == "default_video.mp4"

        # Verify default parameters were used
        mock_generate.assert_called_once()
        args, kwargs = mock_generate.call_args
        assert kwargs.get("aspect_ratio") == "16:9"
        assert kwargs.get("person_generation") == "allow_adult"


@pytest.mark.api
def test_text2video_generate_endpoint_validation_errors(client: TestClient):
    """Test video generation validation errors."""
    # Missing prompt
    response = client.post("/v1/api/text2video/generate", json={})
    assert response.status_code == 422

    # Empty prompt
    response = client.post("/v1/api/text2video/generate", json={"prompt": ""})
    assert response.status_code == 422


@pytest.mark.api
def test_text2video_generate_endpoint_service_error(client: TestClient):
    """Test video generation service error handling."""
    with patch(
        "src.app.services.text2video_service.Text2VideoService.generate_video"
    ) as mock_generate:
        mock_generate.side_effect = VideoGenerationError("Video generation failed")

        response = client.post(
            "/v1/api/text2video/generate", json={"prompt": "test video"}
        )

        assert response.status_code == 500
        data = response.json()
        assert "An unexpected error occurred" in data["detail"]


@pytest.mark.api
def test_text2video_generate_endpoint_rate_limit_error(client: TestClient):
    """Test video generation rate limit error."""
    from google.api_core import exceptions

    with patch(
        "src.app.services.text2video_service.Text2VideoService.generate_video"
    ) as mock_generate:
        mock_generate.side_effect = exceptions.ResourceExhausted("Rate limit exceeded")

        response = client.post(
            "/v1/api/text2video/generate", json={"prompt": "test video"}
        )

        assert response.status_code == 429
        data = response.json()
        assert "Rate limit exceeded" in data["detail"]


@pytest.mark.api
def test_text2video_generate_endpoint_api_error(client: TestClient):
    """Test video generation API error."""
    from google.api_core import exceptions

    with patch(
        "src.app.services.text2video_service.Text2VideoService.generate_video"
    ) as mock_generate:
        mock_generate.side_effect = exceptions.GoogleAPICallError("API error")

        response = client.post(
            "/v1/api/text2video/generate", json={"prompt": "test video"}
        )

        assert response.status_code == 502
        data = response.json()
        assert "video generation service returned an error" in data["detail"]


@pytest.mark.api
def test_text2video_generate_endpoint_generic_error_with_rate_limit(client: TestClient):
    """Test generic error that contains rate limit information."""
    with patch(
        "src.app.services.text2video_service.Text2VideoService.generate_video"
    ) as mock_generate:
        mock_generate.side_effect = Exception("RESOURCE_EXHAUSTED: Rate limit exceeded")

        response = client.post(
            "/v1/api/text2video/generate", json={"prompt": "test video"}
        )

        assert response.status_code == 429
        data = response.json()
        assert "Rate limit exceeded" in data["detail"]


@pytest.mark.api
def test_text2video_download_endpoint_success(client: TestClient, temp_file: str):
    """Test successful video download."""
    filename = "test_video.mp4"

    with (
        patch("os.path.join") as mock_join,
        patch("os.path.exists") as mock_exists,
        patch("src.app.services.text2video_service.Text2VideoService") as mock_service,
    ):
        mock_join.return_value = temp_file
        mock_exists.return_value = True
        mock_service.return_value.output_dir = "/fake/output/dir"

        response = client.get(f"/v1/api/text2video/download/{filename}")

        assert response.status_code == 200


@pytest.mark.api
def test_text2video_download_endpoint_file_not_found(client: TestClient):
    """Test video download when file doesn't exist."""
    with (
        patch("os.path.exists") as mock_exists,
        patch("src.app.services.text2video_service.Text2VideoService") as mock_service,
    ):
        mock_exists.return_value = False
        mock_service.return_value.output_dir = "/fake/output/dir"

        response = client.get("/v1/api/text2video/download/nonexistent.mp4")

        assert response.status_code == 404
        data = response.json()
        assert "File not found" in data["detail"]


@pytest.mark.api
def test_text2video_download_endpoint_server_error(client: TestClient):
    """Test video download server error."""
    with patch("os.path.exists") as mock_exists:
        mock_exists.side_effect = Exception("File system error")

        response = client.get("/v1/api/text2video/download/test.mp4")

        assert response.status_code == 500
        data = response.json()
        assert "Video download failed" in data["detail"]


@pytest.mark.api
def test_get_video_styles_endpoint(client: TestClient):
    """Test getting available video styles."""
    response = client.get("/v1/api/text2video/styles")

    assert response.status_code == 200
    data = response.json()
    assert "styles" in data
    assert isinstance(data["styles"], list)
    assert len(data["styles"]) > 0

    # Check style structure
    style = data["styles"][0]
    assert "id" in style
    assert "name" in style
    assert "description" in style


@pytest.mark.api
def test_get_video_styles_endpoint_error(client: TestClient):
    """Test video styles endpoint error handling."""
    with patch("src.app.api.v1.routes.text2video.logger") as mock_logger:
        mock_logger.error.side_effect = Exception("Logging error")

        response = client.get("/v1/api/text2video/styles")
        # Should still work despite logging error
        assert response.status_code == 200


@pytest.mark.api
def test_text2video_generate_different_aspect_ratios(client: TestClient):
    """Test video generation with different aspect ratios."""
    aspect_ratios = ["16:9", "4:3", "1:1", "9:16"]

    with patch(
        "src.app.services.text2video_service.Text2VideoService.generate_video"
    ) as mock_generate:
        mock_generate.return_value = "test_video.mp4"

        for aspect_ratio in aspect_ratios:
            response = client.post(
                "/v1/api/text2video/generate",
                json={
                    "prompt": f"Test video with {aspect_ratio} aspect ratio",
                    "aspect_ratio": aspect_ratio,
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"


@pytest.mark.api
def test_text2video_generate_complex_prompt(client: TestClient):
    """Test video generation with complex prompt."""
    complex_prompt = """
    Create a cinematic video showing a bustling medieval marketplace at dawn.
    Include merchants setting up their stalls, people in period clothing walking
    through cobblestone streets, and warm sunlight filtering through wooden awnings.
    The camera should slowly pan across the scene, capturing the authentic
    atmosphere of a historical setting.
    """

    with patch(
        "src.app.services.text2video_service.Text2VideoService.generate_video"
    ) as mock_generate:
        mock_generate.return_value = "complex_video.mp4"

        response = client.post(
            "/v1/api/text2video/generate", json={"prompt": complex_prompt.strip()}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["file_path"] == "complex_video.mp4"


@pytest.mark.api
async def test_text2video_generate_endpoint_async(async_client):
    """Test video generation with async client."""
    with patch(
        "src.app.services.text2video_service.Text2VideoService.generate_video"
    ) as mock_generate:
        mock_generate.return_value = "async_video.mp4"

        response = await async_client.post(
            "/v1/api/text2video/generate", json={"prompt": "Async test video"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["file_path"] == "async_video.mp4"


@pytest.mark.api
@pytest.mark.slow
def test_text2video_generate_endpoint_timeout_simulation(client: TestClient):
    """Test video generation with simulated timeout (slow test)."""
    import asyncio

    async def slow_generate(*args, **kwargs):
        await asyncio.sleep(0.1)  # Simulate slow generation
        return "slow_video.mp4"

    with patch(
        "src.app.services.text2video_service.Text2VideoService.generate_video"
    ) as mock_generate:
        mock_generate.side_effect = slow_generate

        response = client.post(
            "/v1/api/text2video/generate", json={"prompt": "Slow video generation test"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
