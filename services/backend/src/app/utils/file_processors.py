"""Utility helper functions."""

import os
import uuid
from typing import Optional


def generate_unique_filename(extension: str = "wav") -> str:
    """
    Generate unique filename.

    Args:
        extension: File extension

    Returns:
        str: Unique filename
    """
    return f"{uuid.uuid4()}.{extension}"


def ensure_directory_exists(directory: str) -> None:
    """
    Ensure directory exists, create if it doesn't.

    Args:
        directory: Directory path
    """
    os.makedirs(directory, exist_ok=True)


def validate_file_size(file_size: int, max_size: int) -> bool:
    """
    Validate file size.

    Args:
        file_size: File size in bytes
        max_size: Maximum allowed size in bytes

    Returns:
        bool: True if valid, False otherwise
    """
    return file_size <= max_size


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe storage.

    Args:
        filename: Original filename

    Returns:
        str: Sanitized filename
    """
    # Remove potentially dangerous characters
    dangerous_chars = ["/", "\\", "..", "<", ">", ":", '"', "|", "?", "*"]

    for char in dangerous_chars:
        filename = filename.replace(char, "_")

    return filename.strip()


def get_file_extension(filename: str) -> Optional[str]:
    """
    Get file extension from filename.

    Args:
        filename: Filename

    Returns:
        Optional[str]: File extension or None
    """
    if "." in filename:
        return filename.rsplit(".", 1)[1].lower()
    return None
