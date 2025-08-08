# Copyright 2025 Loïc Muhirwa
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Main FastAPI application entry point."""

import logging
import re
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.app.api.v1.endpoints import api_router
from src.app.core.config import settings
from src.app.core.logging import setup_logging


def is_allowed_origin(origin: str, allowed_hosts: List[str]) -> bool:
    """
    Check if an origin is allowed based on patterns including wildcards.
    
    Args:
        origin: The origin to check
        allowed_hosts: List of allowed host patterns
        
    Returns:
        True if origin is allowed, False otherwise
    """
    if not origin:
        return False
        
    # Check for exact matches first
    if origin in allowed_hosts:
        return True
        
    # Check for wildcard patterns
    for host in allowed_hosts:
        if host == "*":
            return True
        # Convert wildcard pattern to regex
        if "*" in host:
            # Escape special regex characters except *
            pattern = re.escape(host).replace(r"\*", ".*")
            if re.match(f"^{pattern}$", origin):
                return True
                
    return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown events."""
    setup_logging()
    logging.info("Starting Document Service API...")
    yield
    logging.info("Shutting down Document Service API...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI service for document editing, text-to-speech, text-to-video, and real-time AI chat using Gemini AI",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Set up CORS with custom origin checking for mobile compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://.*\.ngrok-free\.app$|^https://.*\.ngrok\.io$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {
        "message": "Document Service API is running",
        "version": settings.VERSION,
        "services": ["document", "text-to-speech", "text-to-video", "gemini-live"],
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
