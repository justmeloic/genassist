"""Login models for authentication."""

from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Request model for login endpoint."""

    secret: str
    name: str = ""
    gemini_api_key: str


class LoginResponse(BaseModel):
    """Response model for login endpoint."""

    success: bool
    message: str
    session_id: str = ""


class LogoutResponse(BaseModel):
    """Response model for logout endpoint."""

    success: bool
    message: str
