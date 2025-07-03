# Backend Service

![Python](https://img.shields.io/badge/python-v3.13+-blue.svg)
[![FastAPI](https://img.shields.io/badge/FastAPI-099688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-1225F1?logo=google)](https://ai.google.dev/)

Backend service for genassist with Gemini Live API integration.

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

# Set your Gemini API key
export GEMINI_API_KEY='your-api-key-here'
```

### Running the Server

```bash
# Start the development server
uvicorn src.app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will be available at `http://localhost:8000`. The `--reload` flag enables auto-reload on code changes.

## Gemini Live API Demos

Interactive demos showcasing real-time voice and screen sharing capabilities with Gemini's Live API.

### Prerequisites

```bash
# Install demo dependencies
pip install pyaudio mss pillow librosa soundfile

# On macOS, you may need:
brew install portaudio
```

### Voice Chat Demo

Real-time voice conversation with Gemini AI:

```bash
python demos/live_voice_chat.py
```

**Features:**

- 🎤 Live microphone input
- 🔊 AI voice responses
- 📝 Real-time transcription
- ⌨️ Text input support
- 🗣️ Multiple AI voices

### Screen Sharing Demo

Voice conversation with screen sharing:

```bash
python demos/screen_voice_chat.py
```

**Features:**

- 🖥️ Real-time screen capture
- 🎤 Voice conversation about screen content
- 👀 AI can see and discuss what's displayed
- 📸 Automatic screen updates every 2 seconds

### Audio-to-Audio Demos

Various audio processing demonstrations:

```bash
# Simple audio-to-audio conversation
python demos/simple_audio_demo.py

# Full audio demo with file processing
python demos/full_audio_demo.py

# Advanced audio demo with microphone support
python demos/audio_demo.py
```

### Service Testing

Test the Live API service functionality:

```bash
# Basic service functionality test
python demos/test_live_service.py

# Quick Live API demo
python demos/demo_live.py
```

**Important:** Use headphones to prevent audio feedback!
