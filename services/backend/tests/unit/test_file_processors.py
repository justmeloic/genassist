"""Tests for file processing utilities."""

import os
import tempfile

import pytest

from src.app.utils.file_processors import (
    ensure_directory_exists,
    generate_unique_filename,
    get_file_extension,
    sanitize_filename,
    validate_file_size,
)


@pytest.mark.unit
def test_generate_unique_filename():
    """Test unique filename generation."""
    filename1 = generate_unique_filename()
    filename2 = generate_unique_filename()

    # Should be different
    assert filename1 != filename2

    # Should have .wav extension by default
    assert filename1.endswith(".wav")
    assert filename2.endswith(".wav")

    # Should contain UUID format
    assert len(filename1) == 40  # 36 chars for UUID + 4 for '.wav'


@pytest.mark.unit
def test_generate_unique_filename_custom_extension():
    """Test unique filename generation with custom extension."""
    filename = generate_unique_filename("mp4")
    assert filename.endswith(".mp4")
    assert len(filename) == 40  # 36 chars for UUID + 4 for '.mp4'


@pytest.mark.unit
def test_ensure_directory_exists():
    """Test directory creation."""
    with tempfile.TemporaryDirectory() as temp_dir:
        test_dir = os.path.join(temp_dir, "test_subdir", "nested")

        # Directory shouldn't exist initially
        assert not os.path.exists(test_dir)

        # Create directory
        ensure_directory_exists(test_dir)

        # Directory should now exist
        assert os.path.exists(test_dir)
        assert os.path.isdir(test_dir)


@pytest.mark.unit
def test_ensure_directory_exists_already_exists():
    """Test directory creation when directory already exists."""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Directory already exists
        ensure_directory_exists(temp_dir)

        # Should not raise error
        assert os.path.exists(temp_dir)


@pytest.mark.unit
def test_validate_file_size():
    """Test file size validation."""
    max_size = 1024 * 1024  # 1MB

    # Valid sizes
    assert validate_file_size(1024, max_size) is True
    assert validate_file_size(max_size, max_size) is True
    assert validate_file_size(0, max_size) is True

    # Invalid sizes
    assert validate_file_size(max_size + 1, max_size) is False
    assert validate_file_size(max_size * 2, max_size) is False


@pytest.mark.unit
def test_sanitize_filename():
    """Test filename sanitization."""
    test_cases = [
        ("normal_file.txt", "normal_file.txt"),
        ("file with spaces.txt", "file with spaces.txt"),
        ("file/with/slashes.txt", "file_with_slashes.txt"),
        ("file\\with\\backslashes.txt", "file_with_backslashes.txt"),
        ("file<with>dangerous:chars.txt", "file_with_dangerous_chars.txt"),
        ('file"with|quotes?.txt', "file_with_quotes_.txt"),
        ("file*with*wildcards.txt", "file_with_wildcards.txt"),
        ("  file  with  spaces  .txt  ", "file  with  spaces  .txt"),
        ("../../../etc/passwd", "______etc_passwd"),
    ]

    for input_filename, expected in test_cases:
        result = sanitize_filename(input_filename)
        assert result == expected


@pytest.mark.unit
def test_get_file_extension():
    """Test file extension extraction."""
    test_cases = [
        ("file.txt", "txt"),
        ("file.PDF", "pdf"),
        ("file.tar.gz", "gz"),
        ("file", None),
        ("file.", ""),
        (".hidden", ""),
        ("file.JPEG", "jpeg"),
        ("path/to/file.py", "py"),
        ("", None),
    ]

    for filename, expected in test_cases:
        result = get_file_extension(filename)
        assert result == expected


@pytest.mark.unit
def test_sanitize_filename_edge_cases():
    """Test filename sanitization edge cases."""
    # Empty string
    assert sanitize_filename("") == ""

    # Only dangerous characters
    assert sanitize_filename('/<>:"|?*') == "________"

    # Only whitespace
    assert sanitize_filename("   ") == ""

    # Very long filename
    long_name = "a" * 300 + ".txt"
    sanitized = sanitize_filename(long_name)
    assert sanitized == long_name  # Should not truncate in current implementation


@pytest.mark.unit
def test_validate_file_size_edge_cases():
    """Test file size validation edge cases."""
    # Negative size
    assert (
        validate_file_size(-1, 1024) is True
    )  # Current implementation allows negative

    # Zero max size
    assert validate_file_size(0, 0) is True
    assert validate_file_size(1, 0) is False

    # Large numbers
    large_size = 2**63 - 1
    assert validate_file_size(large_size - 1, large_size) is True
    assert validate_file_size(large_size, large_size) is True
