from pydantic import BaseModel
from typing import Optional, List


class Text2ImageRequest(BaseModel):
    """Schema for text-to-image generation request."""

    prompt: str
    num_images: Optional[int] = 4


class Text2ImageResponse(BaseModel):
    """Schema for text-to-image generation response."""

    file_paths: List[str]
    status: str