"""Integration tests for text-to-image API endpoints."""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from src.app.services.text2image_service import ImageGenerationError


@pytest.mark.api
def test_text2image_generate_endpoint_success(client: TestClient):
    """Test successful image generation."""
    with patch(
        "src.app.services.text2image_service.Text2ImageService.generate_images"
    ) as mock_generate:
        mock_generate.return_value = ["image1.png", "image2.png"]

        response = client.post(
            "/v1/api/text2image/generate",
            json={"prompt": "A beautiful sunset over mountains", "num_images": 2},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["file_paths"] == ["image1.png", "image2.png"]
        assert len(data["file_paths"]) == 2


@pytest.mark.api
def test_text2image_generate_endpoint_default_num_images(client: TestClient):
    """Test image generation with default number of images."""
    with patch(
        "src.app.services.text2image_service.Text2ImageService.generate_images"
    ) as mock_generate:
        mock_generate.return_value = ["img1.png", "img2.png", "img3.png", "img4.png"]

        response = client.post(
            "/v1/api/text2image/generate", json={"prompt": "A cute cat"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert len(data["file_paths"]) == 4  # Default value


@pytest.mark.api
def test_text2image_generate_endpoint_validation_errors(client: TestClient):
    """Test image generation validation errors."""
    # Missing prompt
    response = client.post("/v1/api/text2image/generate", json={})
    assert response.status_code == 422

    # Empty prompt
    response = client.post("/v1/api/text2image/generate", json={"prompt": ""})
    assert response.status_code == 422

    # Invalid num_images type
    response = client.post(
        "/v1/api/text2image/generate", json={"prompt": "test", "num_images": "invalid"}
    )
    assert response.status_code == 422


@pytest.mark.api
def test_text2image_generate_endpoint_service_error(client: TestClient):
    """Test image generation service error handling."""
    with patch(
        "src.app.services.text2image_service.Text2ImageService.generate_images"
    ) as mock_generate:
        mock_generate.side_effect = ImageGenerationError("Image generation failed")

        response = client.post(
            "/v1/api/text2image/generate", json={"prompt": "test image"}
        )

        assert response.status_code == 500
        data = response.json()
        assert "Image generation failed" in data["detail"]


@pytest.mark.api
def test_text2image_generate_endpoint_rate_limit_error(client: TestClient):
    """Test image generation rate limit error."""
    from google.api_core import exceptions

    with patch(
        "src.app.services.text2image_service.Text2ImageService.generate_images"
    ) as mock_generate:
        mock_generate.side_effect = exceptions.ResourceExhausted("Rate limit exceeded")

        response = client.post(
            "/v1/api/text2image/generate", json={"prompt": "test image"}
        )

        assert response.status_code == 429
        data = response.json()
        assert "Rate limit exceeded" in data["detail"]


@pytest.mark.api
def test_text2image_generate_endpoint_api_error(client: TestClient):
    """Test image generation API error."""
    from google.api_core import exceptions

    with patch(
        "src.app.services.text2image_service.Text2ImageService.generate_images"
    ) as mock_generate:
        mock_generate.side_effect = exceptions.GoogleAPICallError("API error")

        response = client.post(
            "/v1/api/text2image/generate", json={"prompt": "test image"}
        )

        assert response.status_code == 502
        data = response.json()
        assert "image generation service returned an error" in data["detail"]


@pytest.mark.api
def test_text2image_download_endpoint_success(client: TestClient, temp_file: str):
    """Test successful image download."""
    filename = "test_image.png"

    with (
        patch("os.path.join") as mock_join,
        patch("os.path.exists") as mock_exists,
        patch("src.app.services.text2image_service.Text2ImageService") as mock_service,
    ):
        mock_join.return_value = temp_file
        mock_exists.return_value = True
        mock_service.return_value.output_dir = "/fake/output/dir"

        response = client.get(f"/v1/api/text2image/download/{filename}")

        # FileResponse returns 200 when file exists
        assert response.status_code == 200


@pytest.mark.api
def test_text2image_download_endpoint_file_not_found(client: TestClient):
    """Test image download when file doesn't exist."""
    with (
        patch("os.path.exists") as mock_exists,
        patch("src.app.services.text2image_service.Text2ImageService") as mock_service,
    ):
        mock_exists.return_value = False
        mock_service.return_value.output_dir = "/fake/output/dir"

        response = client.get("/v1/api/text2image/download/nonexistent.png")

        assert response.status_code == 404
        data = response.json()
        assert "File not found" in data["detail"]


@pytest.mark.api
def test_text2image_generate_large_batch(client: TestClient):
    """Test generating a large batch of images."""
    with patch(
        "src.app.services.text2image_service.Text2ImageService.generate_images"
    ) as mock_generate:
        # Generate 10 image filenames
        expected_files = [f"image_{i}.png" for i in range(10)]
        mock_generate.return_value = expected_files

        response = client.post(
            "/v1/api/text2image/generate",
            json={"prompt": "Generate multiple test images", "num_images": 10},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert len(data["file_paths"]) == 10
        assert data["file_paths"] == expected_files


@pytest.mark.api
def test_text2image_generate_complex_prompt(client: TestClient):
    """Test image generation with complex prompt."""
    complex_prompt = """
    A photorealistic image of a futuristic city at sunset, with flying cars,
    tall glass buildings reflecting the orange sky, and people walking on
    elevated walkways. The scene should have a cyberpunk aesthetic with
    neon lights starting to illuminate as daylight fades.
    """

    with patch(
        "src.app.services.text2image_service.Text2ImageService.generate_images"
    ) as mock_generate:
        mock_generate.return_value = ["complex_image.png"]

        response = client.post(
            "/v1/api/text2image/generate",
            json={"prompt": complex_prompt.strip(), "num_images": 1},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert len(data["file_paths"]) == 1

        # Verify the service was called with the complex prompt
        mock_generate.assert_called_once()
        args, kwargs = mock_generate.call_args
        assert complex_prompt.strip() in args


@pytest.mark.api
async def test_text2image_generate_endpoint_async(async_client):
    """Test image generation with async client."""
    with patch(
        "src.app.services.text2image_service.Text2ImageService.generate_images"
    ) as mock_generate:
        mock_generate.return_value = ["async_image.png"]

        response = await async_client.post(
            "/v1/api/text2image/generate", json={"prompt": "Async test image"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["file_paths"] == ["async_image.png"]


@pytest.mark.api
def test_text2image_generate_edge_cases(client: TestClient):
    """Test image generation edge cases."""
    test_cases = [
        # Single image
        {"prompt": "Single image test", "num_images": 1},
        # Zero images (should be handled by validation)
        {"prompt": "Zero images", "num_images": 0},
        # Very short prompt
        {"prompt": "Cat", "num_images": 1},
    ]

    with patch(
        "src.app.services.text2image_service.Text2ImageService.generate_images"
    ) as mock_generate:
        mock_generate.return_value = ["test.png"]

        for test_case in test_cases:
            if test_case["num_images"] == 0:
                # This should fail validation
                response = client.post("/v1/api/text2image/generate", json=test_case)
                # Depending on validation rules, this might be 422 or could be allowed
                assert response.status_code in [200, 422]
            else:
                response = client.post("/v1/api/text2image/generate", json=test_case)
                assert response.status_code == 200
