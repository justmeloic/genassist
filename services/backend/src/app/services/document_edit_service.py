"""Document editing service."""

from typing import Optional

from loguru import logger

from src.app.core.config import settings
from src.app.models.document_edit import DocumentType
from src.app.services.gemini_service import GeminiService


class DocumentEditService:
    """Service for document editing using Gemini AI."""

    def __init__(self):
        """Initialize document edit service."""
        self.gemini_service = GeminiService()

    def _build_edit_prompt(
        self,
        content: str,
        instructions: str,
        document_type: DocumentType,
        additional_context: Optional[str] = None,
    ) -> str:
        """
        Build editing prompt for Gemini AI.

        Args:
            content: Document content
            instructions: Editing instructions
            document_type: Type of document
            additional_context: Additional context

        Returns:
            str: Formatted prompt
        """
        prompt_parts = [
            f"You are an expert document editor specializing in {document_type.value} documents.",
            f"Please edit the following document according to these instructions: {instructions}",
        ]

        if additional_context:
            prompt_parts.append(f"Additional context: {additional_context}")

        prompt_parts.extend(
            [
                "Document to edit:",
                "---",
                content,
                "---",
                "Please provide only the edited document content without any explanations or metadata.",
            ]
        )

        return "\n\n".join(prompt_parts)

    async def edit_document(
        self,
        content: str,
        instructions: str,
        document_type: DocumentType = DocumentType.GENERAL,
        additional_context: Optional[str] = None,
    ) -> str:
        """
        Edit document using Gemini AI.

        Args:
            content: Document content to edit
            instructions: Editing instructions
            document_type: Type of document
            additional_context: Additional context

        Returns:
            str: Edited document content
        """
        try:
            logger.info(f"Editing {document_type.value} document")

            prompt = self._build_edit_prompt(
                content=content,
                instructions=instructions,
                document_type=document_type,
                additional_context=additional_context,
            )

            response = await self.gemini_service.generate_content(
                content=prompt,
                model=settings.GEMINI_MODEL_DOCUMENT,
                response_modalities=["TEXT"],
            )

            edited_content = response.candidates[0].content.parts[0].text

            logger.info("Document editing completed")
            return edited_content.strip()

        except Exception as e:
            logger.error(f"Document editing failed: {str(e)}")
            raise Exception(f"Document editing failed: {str(e)}")
