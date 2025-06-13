"""Document edit data models."""

from enum import Enum


class DocumentType(str, Enum):
    """Document type enumeration."""

    GENERAL = "general"
    ACADEMIC = "academic"
    BUSINESS = "business"
    TECHNICAL = "technical"
    CREATIVE = "creative"


class EditInstruction(str, Enum):
    """Edit instruction type enumeration."""

    GRAMMAR_CHECK = "grammar_check"
    STYLE_IMPROVEMENT = "style_improvement"
    CONTENT_ENHANCEMENT = "content_enhancement"
    SUMMARIZATION = "summarization"
    EXPANSION = "expansion"
    TRANSLATION = "translation"
    CUSTOM = "custom"
