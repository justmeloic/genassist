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

"""Gemini AI service."""

import os
from typing import Optional

from google import genai
from google.genai import types
from loguru import logger

from src.app.core.config import settings


class GeminiService:
    """Service for interacting with Gemini AI."""

    def __init__(self):
        """Initialize Gemini service."""
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    async def generate_content(
        self,
        content: str,
        model: str,
        response_modalities: Optional[list] = None,
        speech_config: Optional[types.SpeechConfig] = None,
    ) -> genai.types.GenerateContentResponse:
        """
        Generate content using Gemini AI.

        Args:
            content: Input content/prompt
            model: Model name to use
            response_modalities: Response modalities (e.g., ["TEXT"], ["AUDIO"])
            speech_config: Speech configuration for TTS

        Returns:
            GenerateContentResponse: Gemini API response
        """
        try:
            config = types.GenerateContentConfig()

            if response_modalities:
                config.response_modalities = response_modalities

            if speech_config:
                config.speech_config = speech_config

            logger.debug(f"Generating content with model: {model}")

            response = await self.client.aio.models.generate_content(
                model=model,
                contents=content,
                config=config,
            )

            # Add response validation and logging
            if not response or not response.candidates:
                raise Exception("Empty response from Gemini API")

            logger.debug(f"Response structure: {response}")
            logger.debug(
                f"First candidate: {response.candidates[0] if response.candidates else 'No candidates'}"
            )

            if not response.candidates[0].content:
                raise Exception("No content in response")

            logger.debug("Content generation completed")
            return response

        except Exception as e:
            logger.error("Gemini API error: %s", e)
            raise
