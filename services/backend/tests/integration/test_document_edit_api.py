"""Integration tests for document edit API endpoints."""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from src.app.models.document_edit import DocumentType


@pytest.mark.api
def test_document_edit_endpoint_success(client: TestClient, sample_document: str):
    """Test successful document editing."""
    with patch(
        "src.app.services.document_edit_service.DocumentEditService.edit_document"
    ) as mock_edit:
        mock_edit.return_value = "This is the edited document content."

        response = client.post(
            "/v1/api/documentedit/",
            json={
                "content": sample_document,
                "instructions": "Fix grammar and improve clarity",
                "document_type": DocumentType.GENERAL.value,
                "additional_context": "This is a business document",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["edited_content"] == "This is the edited document content."
        assert data["original_length"] == len(sample_document)
        assert data["edited_length"] > 0


@pytest.mark.api
def test_document_edit_endpoint_minimal_request(client: TestClient):
    """Test document editing with minimal request."""
    with patch(
        "src.app.services.document_edit_service.DocumentEditService.edit_document"
    ) as mock_edit:
        mock_edit.return_value = "Edited content"

        response = client.post(
            "/v1/api/documentedit/",
            json={"content": "Test content", "instructions": "Test instructions"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["edited_content"] == "Edited content"


@pytest.mark.api
def test_document_edit_endpoint_validation_errors(client: TestClient):
    """Test document edit validation errors."""
    # Missing content
    response = client.post(
        "/v1/api/documentedit/", json={"instructions": "Test instructions"}
    )
    assert response.status_code == 422

    # Missing instructions
    response = client.post("/v1/api/documentedit/", json={"content": "Test content"})
    assert response.status_code == 422

    # Empty content
    response = client.post(
        "/v1/api/documentedit/",
        json={"content": "", "instructions": "Test instructions"},
    )
    assert response.status_code == 422

    # Empty instructions
    response = client.post(
        "/v1/api/documentedit/", json={"content": "Test content", "instructions": ""}
    )
    assert response.status_code == 422


@pytest.mark.api
def test_document_edit_endpoint_service_error(client: TestClient):
    """Test document edit service error handling."""
    with patch(
        "src.app.services.document_edit_service.DocumentEditService.edit_document"
    ) as mock_edit:
        mock_edit.side_effect = Exception("Service error")

        response = client.post(
            "/v1/api/documentedit/",
            json={"content": "Test content", "instructions": "Test instructions"},
        )

        assert response.status_code == 500
        data = response.json()
        assert "Document editing failed" in data["detail"]


@pytest.mark.api
def test_document_edit_endpoint_long_content(client: TestClient):
    """Test document editing with long content."""
    with patch(
        "src.app.services.document_edit_service.DocumentEditService.edit_document"
    ) as mock_edit:
        mock_edit.return_value = "Edited long content"

        long_content = "A" * 50000  # Large but within limits

        response = client.post(
            "/v1/api/documentedit/",
            json={"content": long_content, "instructions": "Edit this content"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["original_length"] == 50000


@pytest.mark.api
def test_document_edit_endpoint_different_document_types(client: TestClient):
    """Test document editing with different document types."""
    document_types = [
        DocumentType.GENERAL,
        DocumentType.ACADEMIC,
        DocumentType.BUSINESS,
        DocumentType.TECHNICAL,
        DocumentType.CREATIVE,
    ]

    with patch(
        "src.app.services.document_edit_service.DocumentEditService.edit_document"
    ) as mock_edit:
        mock_edit.return_value = "Edited content"

        for doc_type in document_types:
            response = client.post(
                "/v1/api/documentedit/",
                json={
                    "content": "Test content",
                    "instructions": "Test instructions",
                    "document_type": doc_type.value,
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"


@pytest.mark.api
def test_document_edit_endpoint_with_additional_context(client: TestClient):
    """Test document editing with additional context."""
    with patch(
        "src.app.services.document_edit_service.DocumentEditService.edit_document"
    ) as mock_edit:
        mock_edit.return_value = "Contextually edited content"

        response = client.post(
            "/v1/api/documentedit/",
            json={
                "content": "Test content",
                "instructions": "Test instructions",
                "additional_context": "This document is for a client presentation",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["edited_content"] == "Contextually edited content"

        # Verify the service was called with the context
        mock_edit.assert_called_once()
        args, kwargs = mock_edit.call_args
        assert (
            kwargs.get("additional_context")
            == "This document is for a client presentation"
        )


@pytest.mark.api
async def test_document_edit_endpoint_async(async_client):
    """Test document edit endpoint with async client."""
    with patch(
        "src.app.services.document_edit_service.DocumentEditService.edit_document"
    ) as mock_edit:
        mock_edit.return_value = "Async edited content"

        response = await async_client.post(
            "/v1/api/documentedit/",
            json={
                "content": "Test content for async",
                "instructions": "Edit asynchronously",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["edited_content"] == "Async edited content"
        assert data["status"] == "success"
