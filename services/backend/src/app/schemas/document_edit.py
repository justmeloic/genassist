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

"""Document edit API schemas."""

from typing import Optional

from pydantic import BaseModel, Field, field_validator

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
        default=None,
        description="Additional context for editing",
        max_length=1000,
    )

    @field_validator("content")
    def validate_content(cls, v: str) -> str:
        """
        Validates that the content is not empty or just whitespace.

        Args:
            v: The content string.

        Returns:
            The stripped content string.

        Raises:
            ValueError: If the content is empty.
        """
        if not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()

    @field_validator("instructions")
    def validate_instructions(cls, v: str) -> str:
        """
        Validates that the instructions are not empty or just whitespace.

        Args:
            v: The instructions string.

        Returns:
            The stripped instructions string.

        Raises:
            ValueError: If the instructions are empty.
        """
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
