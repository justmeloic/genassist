"""Test configuration and fixtures."""

import asyncio
import os
import tempfile
from typing import Generator

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from httpx import AsyncClient

from src.app.core.config import Settings
from src.app.main import app

# Load test environment variables
load_dotenv(".env.test")


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    """Create test settings using environment variables."""
    return Settings()


@pytest.fixture(scope="session")
def test_directories(test_settings: Settings) -> Generator[None, None, None]:
    """Create and cleanup test directories."""
    directories = [
        test_settings.AUDIO_OUTPUT_DIR,
        test_settings.VIDEO_OUTPUT_DIR,
        test_settings.IMAGE_OUTPUT_DIR,
        test_settings.UPLOAD_DIR,
    ]

    # Create directories
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

    yield

    # Cleanup directories
    import shutil

    for directory in directories:
        if os.path.exists(directory):
            shutil.rmtree(directory, ignore_errors=True)


@pytest.fixture
def client(test_directories) -> TestClient:
    """Create test client."""
    return TestClient(app)


@pytest.fixture
async def async_client(test_directories):
    """Create async test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def sample_text() -> str:
    """Sample text for testing."""
    return "Hello, this is a test message for text processing."


@pytest.fixture
def sample_document() -> str:
    """Sample document for testing."""
    return """
    # Test Document
    
    This is a sample document that needs editing.
    It contains some grammatical errors and could be improved.
    
    The document talks about various topics and needs refinement.
    """


@pytest.fixture
def sample_conversation() -> str:
    """Sample conversation for multi-speaker TTS testing."""
    return """
    Joe: Hello, how are you doing today?
    Jane: I'm doing great, thanks for asking! How about you?
    Joe: I'm doing well too. What are your plans for the weekend?
    Jane: I'm planning to go hiking. Would you like to join me?
    """


@pytest.fixture
def mock_audio_data() -> bytes:
    """Mock audio data for testing."""
    # Create simple WAV header + minimal audio data
    return b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x22\x56\x00\x00\x44\xac\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"


@pytest.fixture
def mock_image_data() -> bytes:
    """Mock image data for testing."""
    # Simple PNG header
    return b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82"


@pytest.fixture
def temp_file():
    """Create a temporary file for testing."""
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(b"test content")
        tmp.flush()
        yield tmp.name

    # Cleanup
    if os.path.exists(tmp.name):
        os.unlink(tmp.name)


# Mock fixtures for external services
@pytest.fixture
def mock_gemini_response():
    """Mock Gemini API response."""

    class MockCandidate:
        def __init__(self, content_text=None, audio_data=None):
            self.content = MockContent(content_text, audio_data)

    class MockContent:
        def __init__(self, text=None, audio_data=None):
            if text:
                self.parts = [MockPart(text=text)]
            elif audio_data:
                self.parts = [MockPart(audio_data=audio_data)]

    class MockPart:
        def __init__(self, text=None, audio_data=None):
            if text:
                self.text = text
            elif audio_data:
                self.inline_data = MockInlineData(audio_data)

    class MockInlineData:
        def __init__(self, data):
            self.data = data

    return MockCandidate


@pytest.fixture
def mock_successful_document_response(mock_gemini_response):
    """Mock successful document edit response."""
    return mock_gemini_response(content_text="This is the edited document content.")


@pytest.fixture
def mock_successful_tts_response(mock_gemini_response, mock_audio_data):
    """Mock successful TTS response."""
    return mock_gemini_response(audio_data=mock_audio_data)
