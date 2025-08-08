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

from pydantic import BaseModel
from typing import Optional


class Text2VideoRequest(BaseModel):
    """Schema for text-to-video generation request."""

    prompt: str
    aspect_ratio: Optional[str] = "16:9"
    person_generation: Optional[str] = "allow_adult"


class Text2VideoResponse(BaseModel):
    """Schema for text-to-video generation response."""

    file_path: str
    status: str
