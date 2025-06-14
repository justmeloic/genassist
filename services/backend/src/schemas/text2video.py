from pydantic import BaseModel
from typing import Optional


class Text2VideoRequest(BaseModel):
    """Schema for text-to-video generation request."""
    prompt: str
    aspect_ratio: Optional[str] = "16:9"
    person_generation: Optional[str] = "dont_allow"


class Text2VideoResponse(BaseModel):
    """Schema for text-to-video generation response."""
    file_path: str
    status: str