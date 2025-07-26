#!/bin/bash

# Deploy Genassist application (frontend + backend services)
# This script activates environments and starts both services in screen sessions
# Prerequisites: 
#   - Backend virtual environment should be set up at services/backend/.venv
#   - Frontend dependencies should be installed in services/frontend
#   - Both environments should be ready to run

set -e  # Exit on any error

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/deploy_${TIMESTAMP}.log"

# Service Configuration
FRONTEND_SCREEN="genassist-frontend"
BACKEND_SCREEN="genassist-backend"
NGROK_SCREEN="genassist-ngrok"
FRONTEND_PORT=3000
BACKEND_PORT=8000
FRONTEND_HOST=0.0.0.0
BACKEND_HOST=0.0.0.0

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log messages to both console and file
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to stop existing screen sessions
stop_services() {
    log "🛑 Stopping existing services..."
    
    if screen -list | grep -q "$BACKEND_SCREEN"; then
        log "   Stopping backend screen session: $BACKEND_SCREEN"
        screen -S "$BACKEND_SCREEN" -X quit 2>/dev/null || true
    fi
    
    if screen -list | grep -q "$FRONTEND_SCREEN"; then
        log "   Stopping frontend screen session: $FRONTEND_SCREEN"
        screen -S "$FRONTEND_SCREEN" -X quit 2>/dev/null || true
    fi
    
    if screen -list | grep -q "$NGROK_SCREEN"; then
        log "   Stopping ngrok screen session: $NGROK_SCREEN"
        screen -S "$NGROK_SCREEN" -X quit 2>/dev/null || true
    fi
    
    # Wait a moment for processes to terminate
    sleep 2
}

log "🚀 Starting Genassist deployment at $(date)..."
log "📁 Project root: $PROJECT_ROOT"

# Prerequisite checks
log "🔍 Checking prerequisites..."

# Check if we're in the right directory
if [ ! -d "services/frontend" ] || [ ! -d "services/backend" ]; then
    log "❌ Error: services/frontend or services/backend directories not found!"
    log "💡 Please run this script from the project root directory."
    exit 1
fi

# Check if backend virtual environment exists
if [ ! -d "services/backend/.venv" ]; then
    log "❌ Error: Backend virtual environment not found at services/backend/.venv"
    log "💡 Please set up the backend environment first:"
    log "   cd services/backend && python3 -m venv .venv && source .venv/bin/activate && pip install -e ."
    exit 1
fi

# Check if frontend dependencies are installed
if [ ! -d "services/frontend/node_modules" ]; then
    log "❌ Error: Frontend dependencies not found at services/frontend/node_modules"
    log "💡 Please install frontend dependencies first:"
    log "   cd services/frontend && npm install"
    exit 1
fi

# Check if frontend is built for production
if [ ! -d "services/frontend/.next" ]; then
    log "❌ Error: Frontend build not found. Building now..."
    cd "$PROJECT_ROOT/services/frontend"
    log "🔨 Building frontend for production..."
    npm run build
    if [ $? -ne 0 ]; then
        log "❌ Frontend build failed!"
        exit 1
    fi
    log "✅ Frontend built successfully"
    cd "$PROJECT_ROOT"
fi

# Check if required commands exist
for cmd in screen node python3; do
    if ! command -v $cmd &> /dev/null; then
        log "❌ Error: Required command '$cmd' not found"
        log "💡 Please install $cmd first"
        exit 1
    fi
done

# Check if ngrok is available (optional)
NGROK_AVAILABLE=false
if command -v ngrok &> /dev/null; then
    # Check if authtoken is configured (either via config file or environment)
    if [ -n "$NGROK_AUTH_TOKEN" ] || [ -f ~/.config/ngrok/ngrok.yml ]; then
        NGROK_AVAILABLE=true
        log "✅ Ngrok found and configured - will create public tunnel"
    else
        log "⚠️  Ngrok found but not configured - skipping public tunnel"
        log "💡 Set NGROK_AUTH_TOKEN environment variable or run: ngrok config add-authtoken YOUR_TOKEN"
    fi
else
    log "⚠️  Ngrok not found - skipping public tunnel"
fi

log "✅ All prerequisites met"

# Check port availability
log "🔍 Checking port availability..."
if check_port $FRONTEND_PORT; then
    log "⚠️  Port $FRONTEND_PORT is in use, stopping existing process..."
    lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    sleep 2
fi

if check_port $BACKEND_PORT; then
    log "⚠️  Port $BACKEND_PORT is in use, stopping existing process..."
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Stop any existing screen sessions
stop_services

log "🚀 Starting services..."

# Start Backend Service
log "🔧 Starting backend service..."
cd "$PROJECT_ROOT/services/backend"

if [ ! -f ".venv/bin/activate" ]; then
    log "❌ Error: Backend virtual environment not found at .venv/bin/activate"
    exit 1
fi

# Backend server commands
UVICORN_CMD="uvicorn src.app.main:app --reload --host $BACKEND_HOST --port $BACKEND_PORT"
GUNICORN_CMD="gunicorn src.app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind $BACKEND_HOST:$BACKEND_PORT --timeout 600"

# Use Gunicorn by default (set USE_UVICORN=1 to use Uvicorn instead)
if [ "$USE_UVICORN" = "1" ]; then
    BACKEND_CMD="$UVICORN_CMD"
    SERVER_TYPE="Uvicorn (development)"
else
    BACKEND_CMD="$GUNICORN_CMD"
    SERVER_TYPE="Gunicorn (production)"
fi

screen -dmS "$BACKEND_SCREEN" bash -c "
    cd '$PROJECT_ROOT/services/backend'
    source .venv/bin/activate
    echo '🚀 Starting Backend Server with $SERVER_TYPE...'
    echo '🌐 Backend available at: http://$BACKEND_HOST:$BACKEND_PORT'
    echo '📚 API docs at: http://$BACKEND_HOST:$BACKEND_PORT/docs'
    $BACKEND_CMD
"

log "✅ Backend started in screen session: $BACKEND_SCREEN"

# Start Frontend Service  
log "🔧 Starting frontend service..."
cd "$PROJECT_ROOT/services/frontend"

if [ ! -d "node_modules" ]; then
    log "❌ Error: Frontend node_modules not found. Run 'npm install' first."
    exit 1
fi

screen -dmS "$FRONTEND_SCREEN" bash -c "
    cd '$PROJECT_ROOT/services/frontend'
    echo '🚀 Starting Frontend Server...'
    echo '🌐 Frontend available at: http://$FRONTEND_HOST:$FRONTEND_PORT'
    npm run start -- --hostname $FRONTEND_HOST --port $FRONTEND_PORT
"

log "✅ Frontend started in screen session: $FRONTEND_SCREEN"

# Start Ngrok Service (expose frontend to internet) - only if available and configured
if [ "$NGROK_AVAILABLE" = true ]; then
    log "🌐 Starting ngrok tunnel..."
    screen -dmS "$NGROK_SCREEN" bash -c "
        # Use environment variable if available, otherwise rely on config file
        if [ -n '$NGROK_AUTH_TOKEN' ]; then
            export NGROK_AUTHTOKEN='$NGROK_AUTH_TOKEN'
        fi
        echo '🚀 Starting Ngrok tunnel for frontend...'
        echo '🌍 Exposing http://localhost:$FRONTEND_PORT to the internet'
        ngrok http $FRONTEND_PORT
    "
    log "✅ Ngrok tunnel started in screen session: $NGROK_SCREEN"
else
    log "⚠️  Skipping ngrok tunnel (not available or not configured)"
fi

# Wait for services to start
sleep 3

# Verify services are running
log "🔍 Verifying services..."

if screen -list | grep -q "$BACKEND_SCREEN"; then
    log "✅ Backend screen session running"
else
    log "❌ Backend screen session failed to start"
fi

if screen -list | grep -q "$FRONTEND_SCREEN"; then
    log "✅ Frontend screen session running"
else
    log "❌ Frontend screen session failed to start"
fi

if [ "$NGROK_AVAILABLE" = true ]; then
    if screen -list | grep -q "$NGROK_SCREEN"; then
        log "✅ Ngrok tunnel running"
    else
        log "❌ Ngrok tunnel failed to start (check authtoken)"
    fi
fi

log ""
log "🎯 Deployment completed!"
log ""
log "📺 Screen Sessions:"
log "   Backend:  screen -r $BACKEND_SCREEN"
log "   Frontend: screen -r $FRONTEND_SCREEN"
if [ "$NGROK_AVAILABLE" = true ]; then
    log "   Ngrok:    screen -r $NGROK_SCREEN"
fi
log "   List all: screen -list"
log ""
log "🌐 Access URLs:"
log "   Frontend: http://localhost:$FRONTEND_PORT"
log "   Backend:  http://localhost:$BACKEND_PORT"
log "   API Docs: http://localhost:$BACKEND_PORT/docs"
if [ "$NGROK_AVAILABLE" = true ]; then
    log "   Public:   Check ngrok session for public URL"
fi
log ""
log "🔧 Server Configuration:"
if [ "$USE_UVICORN" = "1" ]; then
    log "   Backend: Uvicorn (development mode with auto-reload)"
else
    log "   Backend: Gunicorn (production mode with 4 workers)"
fi
log ""
log "💡 To switch to Uvicorn (development): USE_UVICORN=1 ./scripts/deploy.sh"
log ""
log "🛑 To stop services:"
log "   screen -S $BACKEND_SCREEN -X quit"
log "   screen -S $FRONTEND_SCREEN -X quit"
log "   screen -S $NGROK_SCREEN -X quit"