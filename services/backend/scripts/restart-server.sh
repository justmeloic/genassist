#!/bin/bash

# Find and kill the process running with your specific app path
pkill -f "uvicorn src.app.main:app"

# Start the server again using your exact command
nohup uvicorn src.app.main:app --reload --host 0.0.0.0 --port 8000 &
