#!/bin/bash

# Deploy Genassist application (frontend + backend services)
# This script sets up both frontend and backend in separate screen sessions

# Configuration
PROJECT_ROOT="/Users/$(whoami)/Desktop/projects/tooling/web/genassist"
DEPLOY_DIR="$PROJECT_ROOT/latest-deployment"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/deploy_${TIMESTAMP}.log"

# Service Configuration
FRONTEND_SCREEN="genassist-frontend"
BACKEND_SCREEN="genassist-backend"
FRONTEND_PORT=3000
BACKEND_PORT=8000
PYTHON_VERSION="3.13"
NODE_VERSION="18"
VENV_NAME=".venv"

# Server Configuration
FRONTEND_HOST=0.0.0.0
BACKEND_HOST=0.0.0.0

# Profile Configurations
export PATH="$PATH:$HOME/.local/bin:$HOME/.nvm/versions/node/v${NODE_VERSION}/bin"

# Handy aliases
alias gs='git status'
alias dev-frontend='cd services/frontend && npm run dev'
alias dev-backend='cd services/backend && uvicorn src.app.main:app --reload --host 0.0.0.0 --port $BACKEND_PORT'
alias serve-frontend='cd services/frontend && npm run build && npm run start'
alias serve-backend='cd services/backend && gunicorn src.app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$BACKEND_PORT --timeout 600'

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log messages to both console and file
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

log "🚀 Starting Genassist deployment process at $(date)..."

# Create deployment directory
log "📁 Creating deployment directory: $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Check if we're in the right directory or need to copy files
if [ -d "services/frontend" ] && [ -d "services/backend" ]; then
    log "✅ Found services directories in current location"
    WORK_DIR="$(pwd)"
else
    log "📂 Copying project files to deployment directory..."
    cp -r . "$DEPLOY_DIR/"
    cd "$DEPLOY_DIR"
    WORK_DIR="$DEPLOY_DIR"
fi

log "📍 Working directory: $WORK_DIR"

# Install system dependencies
log "🔧 Updating package list..."
if ! sudo apt-get update -y >> "$LOG_FILE" 2>&1; then
    log "❌ Error: Failed to update package list."
    log "🔄 Continuing with deployment anyway..."
fi

log "🔧 Installing required packages (curl, python3.13, python3.13-venv, build-essential)..."
if ! sudo apt-get install -y curl python3.13 python3.13-venv build-essential >> "$LOG_FILE" 2>&1; then
    log "❌ Error: Failed to install system dependencies."
    log "🔄 Continuing with deployment anyway..."
fi
log "✅ System dependencies checked/installed."

# Install Node.js using NodeSource repository
log "🟢 Installing Node.js ${NODE_VERSION}..."
if ! command -v node &> /dev/null || [[ "$(node --version)" != *"v${NODE_VERSION}"* ]]; then
    log "📦 Setting up NodeSource repository..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash - >> "$LOG_FILE" 2>&1
    sudo apt-get install -y nodejs >> "$LOG_FILE" 2>&1
    log "✅ Node.js installed: $(node --version)"
    log "✅ npm installed: $(npm --version)"
else
    log "✅ Node.js already installed: $(node --version)"
fi

# Check Python installation
log "🐍 Checking Python installation..."
if command -v python3.13 &> /dev/null; then
    PYTHON_CMD="python3.13"
    log "✅ Python 3.13 found: $(python3.13 --version)"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    log "✅ Python3 found: $(python3 --version)"
else
    log "❌ Error: Python not found. Please install Python first."
    exit 1
fi

# Kill existing screen sessions
log "🔍 Checking for existing screen sessions..."
for screen_name in "$FRONTEND_SCREEN" "$BACKEND_SCREEN"; do
    if screen -list | grep -q "$screen_name"; then
        log "🛑 Killing existing screen session: $screen_name"
        screen -S "$screen_name" -X quit 2>>"$LOG_FILE" || true
        sleep 2
    fi
done

# Kill processes using our ports
for port in "$FRONTEND_PORT" "$BACKEND_PORT"; do
    log "🔍 Checking for processes using port $port..."
    PORT_PROCESS=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$PORT_PROCESS" ]; then
        log "🛑 Found process using port $port (PID: $PORT_PROCESS), killing it..."
        kill -9 $PORT_PROCESS 2>/dev/null || true
        sleep 2
        log "✅ Port $port cleared"
    else
        log "✅ Port $port is available"
    fi
done

# Kill any existing node or uvicorn processes
log "🔍 Checking for any running node/uvicorn processes..."
if pgrep -f "node.*next" > /dev/null 2>&1; then
    log "🛑 Found running Next.js processes, killing them..."
    pkill -f "node.*next" 2>/dev/null || true
    sleep 2
fi
if pgrep -f "uvicorn" > /dev/null 2>&1; then
    log "🛑 Found running uvicorn processes, killing them..."
    pkill -f "uvicorn" 2>/dev/null || true
    sleep 2
fi

# ================================
# BACKEND DEPLOYMENT
# ================================
log "🔧 Setting up Backend Service..."
cd "$WORK_DIR/services/backend"

# Create virtual environment for backend
log "🐍 Creating Python virtual environment for backend..."
if $PYTHON_CMD -m venv "$VENV_NAME" 2>>"$LOG_FILE"; then
    log "✅ Backend virtual environment created successfully"
else
    log "❌ Error: Failed to create backend virtual environment"
    exit 1
fi

# Install backend dependencies
log "📦 Installing backend dependencies..."
if [ -f "$VENV_NAME/bin/activate" ]; then
    source "$VENV_NAME/bin/activate"
    log "✅ Backend virtual environment activated"
    
    # Upgrade pip
    log "⬆️  Upgrading pip..."
    pip install --upgrade pip >> "$LOG_FILE" 2>&1
    
    # Install dependencies
    if [ -f "requirements.txt" ]; then
        log "📋 Installing from requirements.txt..."
        pip install -r requirements.txt >> "$LOG_FILE" 2>&1
        log "✅ Backend dependencies installed from requirements.txt"
    else
        log "❌ Error: requirements.txt not found in backend directory"
        exit 1
    fi
    
    # Install project if pyproject.toml exists
    if [ -f "pyproject.toml" ]; then
        log "📋 Installing backend project..."
        pip install -e . >> "$LOG_FILE" 2>&1
        log "✅ Backend project installed"
    fi
else
    log "❌ Error: Backend virtual environment activation failed"
    exit 1
fi

# ================================
# FRONTEND DEPLOYMENT
# ================================
log "🔧 Setting up Frontend Service..."
cd "$WORK_DIR/services/frontend"

# Install frontend dependencies
log "📦 Installing frontend dependencies..."
if [ -f "package.json" ]; then
    log "📋 Running npm install..."
    if npm install >> "$LOG_FILE" 2>&1; then
        log "✅ Frontend dependencies installed"
    else
        log "❌ Error: Failed to install frontend dependencies"
        exit 1
    fi
else
    log "❌ Error: package.json not found in frontend directory"
    exit 1
fi

# Build frontend
log "🏗️  Building frontend..."
if npm run build >> "$LOG_FILE" 2>&1; then
    log "✅ Frontend build completed successfully"
else
    log "❌ Error: Frontend build failed"
    exit 1
fi

# ================================
# START SERVICES IN SCREEN SESSIONS
# ================================

# Start Backend Service
log "🖥️  Creating backend screen session: $BACKEND_SCREEN"
cd "$WORK_DIR/services/backend"
GUNICORN_CMD="gunicorn src.app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind $BACKEND_HOST:$BACKEND_PORT --timeout 600"

screen -dmS "$BACKEND_SCREEN" bash -c "
    cd '$WORK_DIR/services/backend'
    source '$VENV_NAME/bin/activate' 2>/dev/null || true
    echo '🚀 Starting Backend Server in screen session...'
    echo '📍 Working directory: \$(pwd)'
    echo '🐍 Python: \$(which python)'
    echo '⚡ Command: $GUNICORN_CMD'
    echo '🌐 Backend will be available at: http://$BACKEND_HOST:$BACKEND_PORT'
    echo '📺 Screen session: $BACKEND_SCREEN'
    echo ''
    $GUNICORN_CMD
    echo '🛑 Backend server stopped'
    read -p 'Press Enter to exit screen session...'
"

# Wait for backend to start
sleep 3

# Start Frontend Service
log "🖥️  Creating frontend screen session: $FRONTEND_SCREEN"
cd "$WORK_DIR/services/frontend"
FRONTEND_CMD="npm run start -- --hostname $FRONTEND_HOST --port $FRONTEND_PORT"

screen -dmS "$FRONTEND_SCREEN" bash -c "
    cd '$WORK_DIR/services/frontend'
    echo '🚀 Starting Frontend Server in screen session...'
    echo '📍 Working directory: \$(pwd)'
    echo '🟢 Node: \$(which node)'
    echo '⚡ Command: $FRONTEND_CMD'
    echo '🌐 Frontend will be available at: http://$FRONTEND_HOST:$FRONTEND_PORT'
    echo '📺 Screen session: $FRONTEND_SCREEN'
    echo ''
    $FRONTEND_CMD
    echo '🛑 Frontend server stopped'
    read -p 'Press Enter to exit screen session...'
"

# Wait for services to start
sleep 5

# Check if screen sessions are running
BACKEND_RUNNING=false
FRONTEND_RUNNING=false

if screen -list | grep -q "$BACKEND_SCREEN"; then
    log "✅ Backend screen session '$BACKEND_SCREEN' created and running"
    BACKEND_RUNNING=true
else
    log "❌ Error: Failed to create backend screen session"
fi

if screen -list | grep -q "$FRONTEND_SCREEN"; then
    log "✅ Frontend screen session '$FRONTEND_SCREEN' created and running"
    FRONTEND_RUNNING=true
else
    log "❌ Error: Failed to create frontend screen session"
fi

# Test if services are responding
log "🔍 Testing service availability..."
sleep 10  # Give services time to fully start

# Test backend
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BACKEND_PORT/" | grep -q "200\|404"; then
    log "✅ Backend service is responding on port $BACKEND_PORT"
else
    log "⚠️  Backend service may not be fully ready yet (this is normal)"
fi

# Test frontend
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT/" | grep -q "200\|404"; then
    log "✅ Frontend service is responding on port $FRONTEND_PORT"
else
    log "⚠️  Frontend service may not be fully ready yet (this is normal)"
fi

# Back to project root
cd "$WORK_DIR"

# Display deployment summary
log "📊 Deployment Summary:"
log "   📁 Deploy directory: $WORK_DIR"
log "   🐍 Python command: $PYTHON_CMD"
log "   🟢 Node version: $(node --version)"
log "   📺 Backend screen: $BACKEND_SCREEN"
log "   📺 Frontend screen: $FRONTEND_SCREEN"
log "   🌐 Backend URL: http://$BACKEND_HOST:$BACKEND_PORT"
log "   🌐 Frontend URL: http://$FRONTEND_HOST:$FRONTEND_PORT"
log "   📋 Log file: $LOG_FILE"

log "🎉 Genassist deployment process completed at $(date)!"
log ""
log "📺 Screen Session Commands:"
log "   📌 Attach to backend:     screen -r $BACKEND_SCREEN"
log "   📌 Attach to frontend:    screen -r $FRONTEND_SCREEN"
log "   📌 List all sessions:     screen -list"
log "   📌 Kill backend:          screen -S $BACKEND_SCREEN -X quit"
log "   📌 Kill frontend:         screen -S $FRONTEND_SCREEN -X quit"
log "   📌 Kill all services:     screen -S $BACKEND_SCREEN -X quit && screen -S $FRONTEND_SCREEN -X quit"
log ""
log "🖥️  Commands while inside screen session:"
log "   🔌 Detach from screen:    Ctrl+A, then D"
log "   📌 Show help:             Ctrl+A, then ?"
log "   📌 Kill current session:  Ctrl+A, then k"
log "   📌 Create new window:     Ctrl+A, then c"
log "   📌 Next window:           Ctrl+A, then n"
log "   📌 Previous window:       Ctrl+A, then p"
log ""
log "🌐 Access your application:"
log "   🎨 Frontend (UI):         http://localhost:$FRONTEND_PORT"
log "   🔧 Backend (API):         http://localhost:$BACKEND_PORT"
log "   📚 API Documentation:     http://localhost:$BACKEND_PORT/docs"
log ""
log "🔧 Troubleshooting:"
log "   📊 Check logs:            tail -f $LOG_FILE"
log "   🔍 Check processes:       ps aux | grep -E '(uvicorn|gunicorn|node)'"
log "   🌐 Check ports:           netstat -tlnp | grep -E '($FRONTEND_PORT|$BACKEND_PORT)'"
log "   📺 List screens:          screen -list"

if [ "$BACKEND_RUNNING" = true ] && [ "$FRONTEND_RUNNING" = true ]; then
    log ""
    log "🎊 SUCCESS: Both services are running!"
    log "   🎯 Visit http://localhost:$FRONTEND_PORT to use your application"
    exit 0
else
    log ""
    log "⚠️  WARNING: Some services may not have started correctly"
    log "   📋 Check the log file for details: $LOG_FILE"
    log "   📺 Check screen sessions: screen -list"
    exit 1
fi
