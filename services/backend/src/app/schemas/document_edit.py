"""Document edit API schemas."""

from typing import Optional

from pydantic import BaseModel, Field, validator

from src.app.models.document_edit import DocumentType


class DocumentEditRequest(BaseModel):
    """Document edit request schema."""

    content: str = Field(
        ...,
        description="Document content to edit",
        min_length=1,
        max_length=100000,
    )
    instructions: str = Field(
        ...,
        description="Editing instructions",
        min_length=1,
        max_length=1000,
    )
    document_type: DocumentType = Field(
        default=DocumentType.GENERAL,
        description="Type of document",
    )
    additional_context: Optional[str] = Field(
        None,
        description="Additional context for editing",
        max_length=1000,
    )

    @validator("content")
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()

    @validator("instructions")
    def validate_instructions(cls, v):
        if not v.strip():
            raise ValueError("Instructions cannot be empty")
        return v.strip()


class DocumentEditResponse(BaseModel):
    """Document edit response schema."""

    edited_content: str = Field(
        ...,
        description="Edited document content",
    )
    original_length: int = Field(
        ...,
        description="Original content length",
    )
    edited_length: int = Field(
        ...,
        description="Edited content length",
    )
    status: str = Field(
        ...,
        description="Processing status",
    )
