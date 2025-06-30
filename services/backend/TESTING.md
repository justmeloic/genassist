# Testing Infrastructure Guide

This document describes the testing setup and practices for the FastAPI backend service.

## Test Structure

```
tests/
├── conftest.py              # Test configuration and fixtures
├── test_main.py            # Main FastAPI app tests
├── unit/                   # Unit tests
│   ├── test_config.py     # Configuration tests
│   ├── test_dependencies.py # Dependency injection tests
│   ├── test_exceptions.py  # Custom exception tests
│   ├── test_file_processors.py # File utility tests
│   ├── test_schemas.py    # Pydantic schema tests
│   └── test_services.py   # Service layer tests
└── integration/           # Integration tests
    ├── test_document_edit_api.py # Document editing API tests
    ├── test_text2speech_api.py  # Text-to-speech API tests
    ├── test_text2image_api.py   # Text-to-image API tests
    └── test_text2video_api.py   # Text-to-video API tests
```

## Running Tests

### Quick Start

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_main.py

# Run specific test
pytest tests/test_main.py::test_app_creation

# Run tests with specific markers
pytest -m unit          # Run only unit tests
pytest -m api           # Run only API tests
pytest -m integration   # Run only integration tests
```

### Test Categories

```bash
# Run only unit tests (fast)
pytest -m unit

# Run integration tests (may be slower)
pytest -m integration

# Skip slow tests
pytest -m "not slow"

# Run specific modules
pytest tests/unit/           # All unit tests
pytest tests/integration/    # All integration tests
```

### Coverage Reports

Coverage files are organized in the `tests/coverage/` directory:

- `.coverage` - Raw coverage data
- `htmlcov/` - HTML coverage reports

```bash
# View coverage in terminal
pytest --cov=src

# Generate HTML coverage report
pytest --cov=src --cov-report=html
# Then open tests/coverage/htmlcov/index.html in browser

# Run with detailed coverage
pytest --cov=src --cov-report=term-missing --cov-report=html
```

### Debugging Tests

```bash
# Verbose output
pytest -v

# Stop on first failure
pytest -x

# Enter debugger on failure
pytest --pdb

# Show local variables in tracebacks
pytest -l

# Verbose output with no capture (see print statements)
pytest -v -s
```

### Common Commands

```bash
# Quick unit test run
pytest -m unit -v

# Test specific functionality
pytest tests/unit/test_config.py -v
pytest tests/integration/test_document_edit_api.py -v

# Run specific test function
pytest tests/unit/test_config.py::test_settings_default_values

# Run all tests with full coverage report
pytest --cov=src --cov-report=html
```

## Test Categories

### Unit Tests (`@pytest.mark.unit`)

- Test individual functions and classes in isolation
- Use mocks for external dependencies
- Fast execution (< 1s per test)
- No external API calls

### Integration Tests (`@pytest.mark.integration`)

- Test API endpoints end-to-end
- Test service interactions
- May use mocked external services
- Moderate execution time

### API Tests (`@pytest.mark.api`)

- Test FastAPI endpoints
- Test request/response handling
- Test error scenarios
- Use TestClient or AsyncClient

### Slow Tests (`@pytest.mark.slow`)

- Tests that take longer to execute
- Performance tests
- Tests with delays/timeouts
- Usually skipped in CI

## Test Fixtures

### Configuration Fixtures

- `test_settings`: Test configuration
- `test_directories`: Temporary test directories

### Client Fixtures

- `client`: Synchronous TestClient
- `async_client`: Asynchronous test client

### Sample Data Fixtures

- `sample_text`: Sample text for testing
- `sample_document`: Sample document content
- `sample_conversation`: Multi-speaker conversation
- `mock_audio_data`: Mock audio bytes
- `mock_image_data`: Mock image bytes

### Mock Fixtures

- `mock_gemini_response`: Mock Gemini API response
- `mock_successful_document_response`: Mock document edit response
- `mock_successful_tts_response`: Mock TTS response

## Environment Variables

Test environment variables are configured in:

- `pytest.ini` - Main test configuration
- `.env.test` - Test environment file
- `conftest.py` - Test fixtures

### Test Environment Configuration

The test environment is configured to:

- Use mock external services (Gemini AI)
- Create temporary test directories
- Use test-specific configuration values
- Not affect production data

Required test environment variables:

```bash
ENVIRONMENT=testing
DEBUG=true
SECRET_KEY=test-secret-key
GEMINI_API_KEY=test-api-key
AUDIO_OUTPUT_DIR=test_content/audio
VIDEO_OUTPUT_DIR=test_content/video
IMAGE_OUTPUT_DIR=test_content/image
```

Tests use environment variables from `.env.test` file:

- Mock Gemini API key for testing
- Test directories for file outputs
- Debug mode enabled
- Test database settings

## Mocking Strategy

### External Services

- Mock Gemini API calls to avoid real API usage
- Mock file system operations for testing
- Mock HTTP requests for external services

### Service Layer

- Mock service dependencies in API tests
- Test service logic separately from API layer
- Use dependency injection for easier mocking

### Database/Storage

- Mock file operations for media generation
- Use temporary directories for file tests
- Clean up test artifacts automatically

## Coverage Requirements

- Target coverage: 60% (configured in pytest.ini)
- Focus on critical paths and error handling
- Exclude external library code from coverage
- Generate HTML coverage reports for detailed analysis

### Viewing Coverage Reports

```bash
# Terminal coverage report
pytest --cov=src --cov-report=term-missing

# HTML coverage report
pytest --cov=src --cov-report=html
open tests/coverage/htmlcov/index.html  # Open in browser
```

## Best Practices

### Test Naming

- Use descriptive test names that explain what is being tested
- Follow pattern: `test_<function>_<scenario>_<expected_result>`
- Example: `test_document_edit_endpoint_validation_errors`

### Test Structure

- Arrange: Set up test data and mocks
- Act: Execute the code being tested
- Assert: Verify the expected results

### Error Testing

- Test both success and failure scenarios
- Test edge cases and boundary conditions
- Test error handling and exception raising

### Async Testing

- Use `pytest.mark.asyncio` for async tests
- Mock async operations appropriately
- Test both sync and async code paths

## Common Patterns

### Mocking API Responses

```python
with patch('src.app.services.gemini_service.GeminiService.generate_content') as mock_generate:
    mock_generate.return_value = mock_response
    result = await service.method()
    assert result == expected_result
```

### Testing API Endpoints

```python
response = client.post("/v1/api/endpoint/", json=request_data)
assert response.status_code == 200
data = response.json()
assert data["status"] == "success"
```

### Testing Validation Errors

```python
with pytest.raises(ValidationError) as exc_info:
    Schema(invalid_data)
assert "expected error message" in str(exc_info.value)
```

## Continuous Integration

The test suite is designed to run in CI environments:

- All tests use mocks for external services
- No real API keys required for testing
- Temporary directories are cleaned up automatically
- Tests are configured to fail fast on errors

## Debugging Tests

### Running with verbose output

```bash
# Verbose output
pytest -v

# Verbose with no output capture (see print statements)
pytest -v -s

# Show local variables in tracebacks
pytest -l
```

### Using the debugger

```bash
# Enter debugger on failure
pytest --pdb

# Stop on first failure
pytest -x

# Debug specific test
pytest --pdb tests/test_file.py::test_function
```

### Viewing test coverage

```bash
# Terminal coverage
pytest --cov=src --cov-report=term-missing

# HTML coverage report
pytest --cov=src --cov-report=html
open tests/coverage/htmlcov/index.html
```

## Adding New Tests

When adding new functionality:

1. **Add unit tests** for new functions/classes
2. **Add integration tests** for new API endpoints
3. **Update fixtures** if new test data is needed
4. **Mock external dependencies** appropriately
5. **Follow existing naming conventions**
6. **Add appropriate test markers**

### Example Test Template

```python
"""Tests for new_module."""

import pytest
from unittest.mock import patch

from src.app.new_module import NewClass


class TestNewClass:
    """Test NewClass functionality."""

    @pytest.fixture
    def instance(self):
        """Create NewClass instance."""
        return NewClass()

    @pytest.mark.unit
    def test_new_method_success(self, instance):
        """Test successful execution of new_method."""
        # Arrange
        test_input = "test_data"
        expected_output = "expected_result"

        # Act
        result = instance.new_method(test_input)

        # Assert
        assert result == expected_output

    @pytest.mark.unit
    def test_new_method_error(self, instance):
        """Test error handling in new_method."""
        with pytest.raises(ValueError) as exc_info:
            instance.new_method(invalid_input)

        assert "expected error message" in str(exc_info.value)
```

This comprehensive test suite ensures the reliability and maintainability of the FastAPI backend service.

## Troubleshooting

### Common Issues

#### ModuleNotFoundError: No module named 'src'

If you get this error when running pytest, make sure the `pytest.ini` file includes:

```ini
[pytest]
pythonpath = .
```

This adds the current directory to the Python path so imports work correctly.

#### Tests fail due to API key or environment variables

**API Key Configuration Issues:**
If you see errors like "Missing key inputs argument! To use the Google AI API, provide (`api_key`) arguments", make sure your environment files have valid API key values:

```bash
# In .env.test (for testing)
GEMINI_API_KEY=test-gemini-api-key-for-testing-only

# In .env (for development)
GEMINI_API_KEY=your-actual-gemini-api-key-here
```

**Note**: The syntax `GEMINI_API_KEY=${GEMINI_API_KEY}` requires the environment variable to be set externally. For simpler testing, use a direct value.

**Other Environment Variables:**
Some tests may fail if they expect specific environment variable values. Make sure you have the `.env.test` file configured correctly:

```bash
# .env.test should contain test-specific values
ENVIRONMENT=testing
DEBUG=true
SECRET_KEY=test-secret-key-for-testing-only-12345
GEMINI_API_KEY=test-gemini-api-key-for-testing-only
```

#### Coverage reports not generating

If HTML coverage reports aren't being generated, make sure you have pytest-cov installed:

```bash
pip install pytest-cov
# or
uv add pytest-cov
```
