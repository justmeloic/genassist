# Genassist Makefile
# Provides convenient commands for managing the application

.PHONY: deploy start stop status clean install build help logs

# Default target
.DEFAULT_GOAL := help

# Deploy and start all services
deploy:
	@echo "🚀 Deploying Genassist application..."
	@chmod +x scripts/deploy.sh
	@./scripts/deploy.sh

# Alias for deploy
start: deploy

# Stop all running services
stop:
	@echo "🛑 Stopping all Genassist services..."
	@screen -S genassist-backend -X quit 2>/dev/null || true
	@screen -S genassist-frontend -X quit 2>/dev/null || true
	@screen -S genassist-ngrok -X quit 2>/dev/null || true
	@echo "✅ All services stopped"

# Check status of running services
status:
	@echo "📊 Checking service status..."
	@echo ""
	@echo "🖥️  Screen sessions:"
	@screen -list | grep genassist || echo "   No genassist screen sessions found"
	@echo ""
	@echo "🌐 Port usage:"
	@echo "   Frontend (3000): $$(lsof -ti:3000 >/dev/null && echo "🟢 In use" || echo "🔴 Available")"
	@echo "   Backend (8000):  $$(lsof -ti:8000 >/dev/null && echo "🟢 In use" || echo "🔴 Available")"

# Install dependencies for both services
install:
	@echo "📦 Installing dependencies..."
	@echo "   Installing backend dependencies..."
	@cd services/backend && python3 -m venv .venv && source .venv/bin/activate && pip install -e .
	@echo "   Installing frontend dependencies..."
	@cd services/frontend && npm install
	@echo "✅ All dependencies installed"

# Build frontend for production
build:
	@echo "🔨 Building frontend for production..."
	@cd services/frontend && npm run build
	@echo "✅ Frontend built successfully"

# Clean build artifacts and dependencies
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf services/frontend/.next
	@rm -rf services/frontend/node_modules
	@rm -rf services/backend/.venv
	@rm -rf logs/
	@echo "✅ Clean completed"

# View deployment logs
logs:
	@echo "📋 Recent deployment logs:"
	@ls -la logs/ 2>/dev/null | tail -5 || echo "No logs found"
	@echo ""
	@echo "To view latest log:"
	@echo "tail -f logs/deploy_$$(ls logs/ | grep deploy_ | tail -1 | cut -d'_' -f2-)"

# Restart services (stop + start)
restart: stop
	@sleep 2
	@$(MAKE) deploy

# Development mode (use Uvicorn instead of Gunicorn)
dev:
	@echo "🔧 Starting in development mode..."
	@USE_UVICORN=1 ./scripts/deploy.sh

# Quick health check
health:
	@echo "🏥 Health check..."
	@curl -s http://localhost:8000/health >/dev/null && echo "✅ Backend healthy" || echo "❌ Backend not responding"
	@curl -s http://localhost:3000 >/dev/null && echo "✅ Frontend healthy" || echo "❌ Frontend not responding"

# Show help
help:
	@echo ""
	@echo "🚀 Genassist Makefile Commands"
	@echo "================================"
	@echo ""
	@echo "Primary Commands:"
	@echo "  deploy/start    Deploy and start all services"
	@echo "  stop           Stop all running services"
	@echo "  restart        Stop and restart all services"
	@echo "  status         Check status of services"
	@echo ""
	@echo "Development:"
	@echo "  dev            Start in development mode (Uvicorn)"
	@echo "  install        Install all dependencies"
	@echo "  build          Build frontend for production"
	@echo "  clean          Clean build artifacts and dependencies"
	@echo ""
	@echo "Monitoring:"
	@echo "  logs           View recent deployment logs"
	@echo "  health         Quick health check of services"
	@echo ""
	@echo "Examples:"
	@echo "  make deploy    # Start all services"
	@echo "  make dev       # Start in development mode"
	@echo "  make status    # Check if services are running"
	@echo "  make stop      # Stop all services"
	@echo ""
