# Backend Service

![Python](https://img.shields.io/badge/python-v3.13+-blue.svg)
[![FastAPI](https://img.shields.io/badge/FastAPI-099688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-1225F1?logo=google)](https://ai.google.dev/)

Backend service for genassist.

## Development Setup

### Environment Setup

```bash
# Install uv if not already installed
pip install uv

# Create virtual environment and install dependencies
uv venv
uv sync
```

### Configuration

```bash
# Copy the example environment file
cp .env.example .env
```

### Running the Server

```bash
# Start the development server
uvicorn src.app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will be available at `http://localhost:8000`. The `--reload` flag enables auto-reload on code changes.
