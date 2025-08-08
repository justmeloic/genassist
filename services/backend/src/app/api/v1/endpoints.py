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

"""Main API router for v1."""

from fastapi import APIRouter

from src.app.api.v1.routes import (
    auth,
    document_edit,
    gemini_live,
    text2image,
    text2speech,
    text2video,
)

api_router = APIRouter()

api_router.include_router(
    document_edit.router, prefix="/documentedit", tags=["document-edit"]
)

api_router.include_router(
    text2speech.router, prefix="/text2speech", tags=["text-to-speech"]
)

api_router.include_router(
    text2video.router, prefix="/text2video", tags=["text-to-video"]
)

api_router.include_router(
    text2image.router, prefix="/text2image", tags=["text-to-image"]
)

api_router.include_router(
    gemini_live.router, prefix="/gemini-live", tags=["gemini-live"]
)

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
