# Copyright 2025 Loïc Muhirwa
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Defines the API endpoint for document editing.

This endpoint receives document content and editing instructions,
processes them using the Gemini AI service, and returns the
edited content.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger

from src.app.schemas.document_edit import (
    DocumentEditRequest,
    DocumentEditResponse,
)
from src.app.services.document_edit_service import DocumentEditService
from src.app.utils.dependencies import get_document_edit_service

router = APIRouter()


@router.post("/", response_model=DocumentEditResponse)
async def edit_document(
    request: DocumentEditRequest,
    service: DocumentEditService = Depends(get_document_edit_service),
) -> DocumentEditResponse:
    """
    Edit a document using Gemini AI.

    Args:
        request: Document edit request containing text and edit instructions
        service: Document edit service dependency

    Returns:
        DocumentEditResponse: Edited document content

    Raises:
        HTTPException: If document editing fails
    """
    try:
        logger.info(
            "Processing document edit request with %s characters", len(request.content)
        )

        edited_content = await service.edit_document(
            content=request.content,
            instructions=request.instructions,
            document_type=request.document_type,
            additional_context=request.additional_context,
        )

        logger.info("Document editing completed successfully")

        return DocumentEditResponse(
            edited_content=edited_content,
            original_length=len(request.content),
            edited_length=len(edited_content),
            status="success",
        )

    except Exception as e:
        logger.error("Document editing failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document editing failed: {str(e)}",
        )
