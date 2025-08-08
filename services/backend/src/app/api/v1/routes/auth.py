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

"""
Authentication endpoints for the Genassist API.

This module provides endpoints for user authentication including login and logout
functionality. It uses session-based authentication with sessionStorage on the frontend.
"""

import uuid
from typing import Dict

from fastapi import APIRouter, Header, HTTPException

from src.app.core.config import settings
from src.app.models.login import LoginRequest, LoginResponse, LogoutResponse

router = APIRouter()

# Simple in-memory session store - replace with Redis or database in production
active_sessions: Dict[str, Dict] = {}


def get_user_api_key(session_id: str) -> str:
    """
    Retrieve the Gemini API key for a given session.

    Args:
        session_id: The session ID

    Returns:
        The Gemini API key for the session

    Raises:
        HTTPException: If session not found or not authenticated
    """
    if session_id not in active_sessions:
        raise HTTPException(status_code=401, detail="Session not found")

    session = active_sessions[session_id]
    if not session.get("authenticated", False):
        raise HTTPException(status_code=401, detail="Session not authenticated")

    return session.get("gemini_api_key", "")


@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest) -> LoginResponse:
    """
    Authenticate user with secret and create authenticated session.

    Args:
        login_data: Login credentials including secret and optional name

    Returns:
        LoginResponse: Authentication result with session information

    Raises:
        HTTPException: If authentication fails
    """
    try:
        # Validate the secret
        if login_data.secret != settings.AUTH_SECRET:
            raise HTTPException(status_code=401, detail="Invalid access code")

        # Validate the Gemini API key by making a simple test call
        try:
            from google import genai

            # Create a client with the user's API key
            client = genai.Client(api_key=login_data.gemini_api_key)

            # Test the API key with a simple content generation call
            client.models.generate_content(
                model="gemini-2.0-flash-exp", contents="Hello"
            )
            # If this succeeds, the API key is valid
        except genai.errors.ClientError:
            raise HTTPException(status_code=401, detail="Invalid Gemini API key")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid Gemini API key")

        # Create a new session
        session_id = str(uuid.uuid4())

        # Store session data including the API key
        active_sessions[session_id] = {
            "authenticated": True,
            "user_name": login_data.name.strip() if login_data.name else "Anonymous",
            "gemini_api_key": login_data.gemini_api_key,
            "login_timestamp": str(__import__("datetime").datetime.now()),
        }

        return LoginResponse(
            success=True,
            message="Authentication successful",
            session_id=session_id,
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Internal server error during authentication"
        )


@router.post("/logout", response_model=LogoutResponse)
async def logout() -> LogoutResponse:
    """
    Logout user by clearing authentication from session.

    Returns:
        LogoutResponse: Logout result
    """
    try:
        # For this simple implementation, we just return success
        # In a real app, you'd identify the session and remove it
        return LogoutResponse(success=True, message="Logout successful")

    except Exception as e:
        # Return success anyway - logout should be forgiving
        return LogoutResponse(success=True, message="Logout completed")


@router.get("/status")
async def auth_status() -> dict:
    """
    Check current authentication status.

    Returns:
        dict: Authentication status information
    """
    try:
        # For this simple implementation, we can't check status without session ID
        # This would be improved with proper session middleware
        return {
            "authenticated": False,
            "message": "Status check requires session identification",
        }

    except Exception:
        return {
            "authenticated": False,
            "error": "Status check failed",
        }


@router.get("/user-api-key")
async def get_user_api_key_endpoint(x_session_id: str = Header(None)) -> dict:
    """
    Get the user's Gemini API key from their session.

    Args:
        x_session_id: Session ID from X-Session-ID header

    Returns:
        dict: Contains the user's API key
    """
    try:
        if not x_session_id:
            raise HTTPException(status_code=401, detail="Session ID required")

        api_key = get_user_api_key(x_session_id)
        return {"api_key": api_key}

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve API key")
