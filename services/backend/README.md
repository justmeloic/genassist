# Backend Service

![Python](https://img.shields.io/badge/python-v3.13+-blue.svg)
[![FastAPI](https://img.shields.io/badge/FastAPI-099688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-1225F1?logo=google)](https://ai.google.dev/)

Backend service for genassist with Gemini Live API integration.

## Installation & Setup

### System Requirements

- Python 3.11 or higher
- Node.js 18+ (for development tools)
- PortAudio development libraries (for audio processing)

### System Dependencies

#### On Debian/Ubuntu/Raspberry Pi OS:

```bash
# Update package list
sudo apt update

# Install Python 3.11 and development tools
sudo apt install -y python3.11 python3.11-venv python3.11-dev build-essential

# Install PortAudio for PyAudio (required for audio demos)
sudo apt install -y portaudio19-dev

# Install additional system libraries
sudo apt install -y curl git screen
```

#### On macOS:

```bash
# Install PortAudio
brew install portaudio

# Install Python 3.11+ via Homebrew
brew install python@3.11
```

#### On Windows:

```bash
# Install Python 3.11+ from python.org
# PortAudio will be installed automatically with PyAudio
```

### Environment Setup

#### Option 1: Using uv (Recommended)

```bash
# Install uv if not already installed
pip install uv

# Create virtual environment and install dependencies
uv venv
uv sync
```

#### Option 2: Using pip and venv

```bash
# Create virtual environment
python3.11 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # On Linux/macOS
# .venv\Scripts\activate    # On Windows

# Upgrade pip
pip install --upgrade pip

# Install backend project and dependencies
pip install -e .
```

#### Option 3: Using requirements.txt (Alternative)

```bash
# Activate virtual environment first
source .venv/bin/activate

# Install from requirements file
pip install -r requirements.txt
```

### Troubleshooting Installation

#### Common Issues on ARM64/Raspberry Pi:

1. **NumPy compilation takes too long:**
   ```bash
   # Use pre-compiled wheels from piwheels
   pip install --extra-index-url https://www.piwheels.org/simple/ numpy
   ```

2. **PyAudio installation fails:**
   ```bash
   # Ensure PortAudio development headers are installed
   sudo apt install portaudio19-dev
   ```

3. **OpenCV installation issues:**
   ```bash
   # Install system OpenCV libraries
   sudo apt install python3-opencv
   ```

#### Dependency Conflicts:

If you encounter dependency conflicts, try:
```bash
# Clear pip cache
pip cache purge

# Install with dependency resolution
pip install -e . --force-reinstall
```

### Configuration

Create your environment configuration:

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file and set your Gemini API key
# You can get your API key from: https://aistudio.google.com/app/apikey
export GEMINI_API_KEY='your-api-key-here'

# Optional: Set other environment variables
export BACKEND_HOST='0.0.0.0'
export BACKEND_PORT='8000'
export LOG_LEVEL='INFO'
```

### Running the Server

#### Development Mode:

```bash
# Activate virtual environment
source .venv/bin/activate

# Start the development server with auto-reload
uvicorn src.app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Production Mode:

```bash
# Using Gunicorn for production
gunicorn src.app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 600
```

The server will be available at `http://localhost:8000`. 

- API documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## Testing the Installation

### Quick Health Check

```bash
# Activate virtual environment
source .venv/bin/activate

# Test if all imports work
python -c "
import fastapi
import uvicorn
import google.generativeai
import pyaudio
import mss
import cv2
print('✅ All core dependencies imported successfully!')
"

# Start the server and test the health endpoint
uvicorn src.app.main:app --host 0.0.0.0 --port 8000 &
sleep 5
curl http://localhost:8000/health
```

### Running Tests

```bash
# Run the test suite
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test categories
pytest tests/unit/          # Unit tests only
pytest tests/integration/   # Integration tests only
```

### Verify Gemini API Connection

```bash
# Set your API key
export GEMINI_API_KEY='your-api-key-here'

# Test basic Gemini connection
python -c "
import google.generativeai as genai
import os
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-pro')
response = model.generate_content('Hello!')
print('✅ Gemini API connection successful!')
print(f'Response: {response.text}')
"
```

## Gemini Live API Demos

Interactive demos showcasing real-time voice and screen sharing capabilities with Gemini's Live API.

### Prerequisites

Before running the demos, ensure you have the required dependencies:

```bash
# Activate your virtual environment
source .venv/bin/activate

# All dependencies should already be installed if you used the installation methods above
# If you need to install additional demo dependencies manually:
pip install pyaudio mss pillow librosa soundfile numpy opencv-python

# For ARM64/Raspberry Pi systems, you may need:
sudo apt install -y portaudio19-dev python3-opencv

# On macOS, you may need:
brew install portaudio
```

### Audio Setup

**Important Setup Notes:**
- 🎧 **Use headphones** to prevent audio feedback during voice demos
- 🎤 Ensure your microphone is working and permissions are granted
- 🔊 Test your speakers/headphones before running demos
- 📟 On Linux, you may need to configure audio permissions:
  ```bash
  # Add user to audio group
  sudo usermod -a -G audio $USER
  # Log out and back in for changes to take effect
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

## Deployment

### Prerequisites for Deployment

Before running the deployment script, ensure you have:

1. **System dependencies installed:**
   ```bash
   # On Debian/Ubuntu/Raspberry Pi OS
   sudo apt update
   sudo apt install -y python3 python3-venv python3-dev build-essential
   sudo apt install -y portaudio19-dev screen curl git
   sudo apt install -y nodejs npm  # Node.js 18+
   ```

2. **Backend environment set up:**
   ```bash
   cd services/backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -e .
   ```

3. **Frontend dependencies installed:**
   ```bash
   cd services/frontend
   npm install
   ```

### Using the Deployment Script

The project includes a simplified deployment script that activates environments and starts both services:

```bash
# From the project root directory
./scripts/deploy.sh
```

This script will:
- ✅ Check that prerequisites are met
- ✅ Stop any existing services on the same ports
- ✅ Start backend in a screen session (development mode with auto-reload)
- ✅ Start frontend in a screen session (development mode)
- ✅ Provide easy commands to manage the services

### Manual Deployment

#### Backend Service:

```bash
# Navigate to backend directory
cd services/backend

# Activate virtual environment
source .venv/bin/activate

# Set environment variables
export GEMINI_API_KEY='your-api-key-here'

# Development mode
uvicorn src.app.main:app --host 0.0.0.0 --port 8000 --reload

# Production mode
gunicorn src.app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 600
```

#### Frontend Service:

```bash
# Navigate to frontend directory
cd services/frontend

# Development mode
npm run dev

# Production mode
npm run build
npm run start
```

### Managing Screen Sessions

The deployment script uses screen sessions to run services in the background:

```bash
# List all screen sessions
screen -list

# Attach to backend session
screen -r genassist-backend

# Attach to frontend session  
screen -r genassist-frontend

# Detach from a screen session (while inside)
Ctrl+A, then D

# Stop backend service
screen -S genassist-backend -X quit

# Stop frontend service
screen -S genassist-frontend -X quit

# Stop all services
screen -S genassist-backend -X quit
screen -S genassist-frontend -X quit
```

### Environment Variables

Create a `.env` file in the backend directory with:

```bash
# Required
GEMINI_API_KEY=your-api-key-here

# Optional - Server Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
LOG_LEVEL=INFO

# Optional - CORS Configuration
FRONTEND_URL=http://localhost:3000

# Optional - File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads
```

## Architecture

The backend service provides:

- 🚀 **FastAPI** web framework with automatic API documentation
- 🤖 **Gemini Live API** integration for real-time AI conversations
- 🎤 **Audio processing** with PyAudio for microphone input/output
- 🖥️ **Screen capture** with MSS for visual AI interactions
- 📁 **File processing** for document analysis and generation
- 🔒 **CORS support** for frontend integration
- 📊 **Logging** with structured output
- 🧪 **Comprehensive testing** with pytest

### API Endpoints

- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation
- `POST /api/v1/*` - Various API endpoints (see `/docs` for details)
- WebSocket endpoints for real-time communication

### Project Structure

```
services/backend/
├── src/
│   └── app/
│       ├── main.py              # FastAPI application
│       ├── api/                 # API routes
│       ├── core/                # Configuration and logging
│       ├── models/              # Data models
│       ├── schemas/             # Pydantic schemas
│       ├── services/            # Business logic
│       └── utils/               # Utility functions
├── demos/                       # Live API demos
├── tests/                       # Test suite
├── requirements.txt             # Python dependencies
├── pyproject.toml              # Project configuration
└── README.md                   # This file
```
