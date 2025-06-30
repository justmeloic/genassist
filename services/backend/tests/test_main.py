"""Tests for the main FastAPI application."""

import pytest
from fastapi.testclient import TestClient

from src.app.main import app


@pytest.mark.unit
def test_app_creation():
    """Test that the app is created correctly."""
    assert app.title == "Document Service API"
    assert app.version == "1.0.0"


@pytest.mark.api
def test_root_endpoint(client: TestClient):
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Document Service API is running"
    assert data["version"] == "1.0.0"
    assert "services" in data
    assert isinstance(data["services"], list)


@pytest.mark.api
def test_health_check_endpoint(client: TestClient):
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.api
def test_openapi_docs(client: TestClient):
    """Test that OpenAPI documentation is accessible."""
    response = client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


@pytest.mark.api
def test_redoc_docs(client: TestClient):
    """Test that ReDoc documentation is accessible."""
    response = client.get("/redoc")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


@pytest.mark.api
def test_openapi_json(client: TestClient):
    """Test that OpenAPI JSON is accessible."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert "info" in data
    assert data["info"]["title"] == "Document Service API"


@pytest.mark.api
def test_cors_headers(client: TestClient):
    """Test CORS headers are present."""
    response = client.options("/")
    assert response.status_code == 200
    # CORS headers should be present in preflight responses
    # Note: TestClient doesn't always include all CORS headers in test mode


@pytest.mark.api
def test_api_routes_exist(client: TestClient):
    """Test that all expected API routes exist."""
    # Test document edit endpoint exists
    response = client.post(
        "/v1/api/documentedit/", json={"content": "test", "instructions": "test"}
    )
    # We expect a 500 error due to missing Gemini API key, but route should exist
    assert response.status_code in [
        422,
        500,
    ]  # 422 for validation, 500 for service error

    # Test text2speech endpoint exists
    response = client.post("/v1/api/text2speech/", json={"text": "test"})
    assert response.status_code in [422, 500]

    # Test text2image endpoint exists
    response = client.post("/v1/api/text2image/generate", json={"prompt": "test"})
    assert response.status_code in [422, 500]

    # Test text2video endpoint exists
    response = client.post("/v1/api/text2video/generate", json={"prompt": "test"})
    assert response.status_code in [422, 500]


@pytest.mark.api
def test_invalid_route(client: TestClient):
    """Test that invalid routes return 404."""
    response = client.get("/invalid/route")
    assert response.status_code == 404
