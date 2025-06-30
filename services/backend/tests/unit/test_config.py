"""Tests for configuration settings."""

import os

import pytest
from pydantic import ValidationError

from src.app.core.config import Settings, SpeakerDefaults


@pytest.mark.unit
def test_settings_default_values(monkeypatch):
    """Test default configuration values."""
    # Clear all environment variables that might affect defaults
    env_vars_to_clear = [
        "PROJECT_NAME",
        "VERSION",
        "DEBUG",
        "ENVIRONMENT",
        "API_V1_STR",
        "ALLOWED_HOSTS",
        "AUDIO_SAMPLE_RATE",
        "AUDIO_CHANNELS",
        "DEFAULT_VOICE",
    ]
    for var in env_vars_to_clear:
        monkeypatch.delenv(var, raising=False)

    # Set only required environment variables
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("GEMINI_API_KEY", "test-api-key")
    monkeypatch.setenv("AUDIO_OUTPUT_DIR", "test_audio")
    monkeypatch.setenv("VIDEO_OUTPUT_DIR", "test_video")
    monkeypatch.setenv("IMAGE_OUTPUT_DIR", "test_image")

    settings = Settings(_env_file=None)  # Don't load from .env file

    assert settings.PROJECT_NAME == "Document Service API"
    assert settings.VERSION == "1.0.0"
    assert settings.DEBUG is False
    assert settings.ENVIRONMENT == "development"
    assert settings.API_V1_STR == "/v1/api"
    assert settings.ALLOWED_HOSTS == ["*"]
    assert settings.AUDIO_SAMPLE_RATE == 24000
    assert settings.AUDIO_CHANNELS == 1
    assert settings.DEFAULT_VOICE == "Kore"


@pytest.mark.unit
def test_settings_required_fields():
    """Test that required fields raise validation errors when missing."""
    # Clear any existing environment variables
    env_vars = [
        "SECRET_KEY",
        "GEMINI_API_KEY",
        "AUDIO_OUTPUT_DIR",
        "VIDEO_OUTPUT_DIR",
        "IMAGE_OUTPUT_DIR",
    ]
    original_values = {}

    for var in env_vars:
        if var in os.environ:
            original_values[var] = os.environ[var]
            del os.environ[var]

    with pytest.raises(ValidationError):
        Settings()

    # Restore original values
    for var, value in original_values.items():
        os.environ[var] = value


@pytest.mark.unit
def test_gemini_api_key_validation():
    """Test Gemini API key validation."""
    # Set other required vars
    os.environ["SECRET_KEY"] = "test-secret"
    os.environ["AUDIO_OUTPUT_DIR"] = "test_audio"
    os.environ["VIDEO_OUTPUT_DIR"] = "test_video"
    os.environ["IMAGE_OUTPUT_DIR"] = "test_image"

    # Test empty API key
    os.environ["GEMINI_API_KEY"] = ""
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    assert "GEMINI_API_KEY must be set" in str(exc_info.value)

    # Test valid API key
    os.environ["GEMINI_API_KEY"] = "valid-api-key"
    settings = Settings()
    assert settings.GEMINI_API_KEY == "valid-api-key"

    # Clean up
    for key in [
        "SECRET_KEY",
        "GEMINI_API_KEY",
        "AUDIO_OUTPUT_DIR",
        "VIDEO_OUTPUT_DIR",
        "IMAGE_OUTPUT_DIR",
    ]:
        if key in os.environ:
            del os.environ[key]


@pytest.mark.unit
def test_speaker_defaults():
    """Test default speaker configuration."""
    speaker = SpeakerDefaults(speaker="Test", voice_name="TestVoice")
    assert speaker.speaker == "Test"
    assert speaker.voice_name == "TestVoice"


@pytest.mark.unit
def test_settings_from_env_file(tmp_path, monkeypatch):
    """Test loading settings from .env file."""
    # Clear environment variables to ensure clean state
    env_vars_to_clear = [
        "PROJECT_NAME",
        "DEBUG",
        "SECRET_KEY",
        "GEMINI_API_KEY",
        "AUDIO_OUTPUT_DIR",
        "VIDEO_OUTPUT_DIR",
        "IMAGE_OUTPUT_DIR",
    ]
    for var in env_vars_to_clear:
        monkeypatch.delenv(var, raising=False)

    # Create a temporary .env file
    env_file = tmp_path / ".env"
    env_content = """
SECRET_KEY=env-file-secret
GEMINI_API_KEY=env-file-api-key
AUDIO_OUTPUT_DIR=env-audio
VIDEO_OUTPUT_DIR=env-video
IMAGE_OUTPUT_DIR=env-image
DEBUG=true
PROJECT_NAME=Test Project
"""
    env_file.write_text(env_content.strip())

    # Change to temp directory so .env file is found
    original_cwd = os.getcwd()
    os.chdir(tmp_path)

    try:
        settings = Settings()
        assert settings.SECRET_KEY == "env-file-secret"
        assert settings.GEMINI_API_KEY == "env-file-api-key"
        assert settings.DEBUG is True
        assert settings.PROJECT_NAME == "Test Project"
    finally:
        os.chdir(original_cwd)


@pytest.mark.unit
def test_audio_configuration():
    """Test audio-related configuration."""
    os.environ.update(
        {
            "SECRET_KEY": "test-secret",
            "GEMINI_API_KEY": "test-api-key",
            "AUDIO_OUTPUT_DIR": "test_audio",
            "VIDEO_OUTPUT_DIR": "test_video",
            "IMAGE_OUTPUT_DIR": "test_image",
            "AUDIO_SAMPLE_RATE": "48000",
            "AUDIO_CHANNELS": "2",
            "DEFAULT_VOICE": "TestVoice",
        }
    )

    settings = Settings()
    assert settings.AUDIO_SAMPLE_RATE == 48000
    assert settings.AUDIO_CHANNELS == 2
    assert settings.DEFAULT_VOICE == "TestVoice"

    # Clean up
    for key in [
        "SECRET_KEY",
        "GEMINI_API_KEY",
        "AUDIO_OUTPUT_DIR",
        "VIDEO_OUTPUT_DIR",
        "IMAGE_OUTPUT_DIR",
        "AUDIO_SAMPLE_RATE",
        "AUDIO_CHANNELS",
        "DEFAULT_VOICE",
    ]:
        if key in os.environ:
            del os.environ[key]


@pytest.mark.unit
def test_default_speakers_configuration():
    """Test default speakers configuration."""
    os.environ.update(
        {
            "SECRET_KEY": "test-secret",
            "GEMINI_API_KEY": "test-api-key",
            "AUDIO_OUTPUT_DIR": "test_audio",
            "VIDEO_OUTPUT_DIR": "test_video",
            "IMAGE_OUTPUT_DIR": "test_image",
        }
    )

    settings = Settings()
    assert len(settings.DEFAULT_SPEAKERS) == 2
    assert settings.DEFAULT_SPEAKERS[0].speaker == "Joe"
    assert settings.DEFAULT_SPEAKERS[0].voice_name == "Algieba"
    assert settings.DEFAULT_SPEAKERS[1].speaker == "Jane"
    assert settings.DEFAULT_SPEAKERS[1].voice_name == "Kore"

    # Clean up
    for key in [
        "SECRET_KEY",
        "GEMINI_API_KEY",
        "AUDIO_OUTPUT_DIR",
        "VIDEO_OUTPUT_DIR",
        "IMAGE_OUTPUT_DIR",
    ]:
        if key in os.environ:
            del os.environ[key]
