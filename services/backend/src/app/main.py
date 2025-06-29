"""Main FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.app.api.v1.api import api_router
from src.app.core.config import settings
from src.app.core.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown events."""
    setup_logging()
    logging.info("Starting Document Service API...")
    yield
    logging.info("Shutting down Document Service API...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI service for document editing, text-to-speech, and text-to-video using Gemini AI",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
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
        "services": ["document", "text-to-speech", "text-to-video"],
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
