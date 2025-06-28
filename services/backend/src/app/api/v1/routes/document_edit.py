"""Document editing endpoint."""

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
            f"Processing document edit request with {len(request.content)} characters"
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
        logger.error(f"Document editing failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document editing failed: {str(e)}",
        )
