"""Text-to-speech service."""

import wave
from typing import Optional

from google.genai import types
from loguru import logger

from src.core.config import settings
from src.models.text2speech import VoiceName, SpeechSpeed, SpeechPitch
from src.services.gemini_service import GeminiService


class Text2SpeechService:
    """Service for text-to-speech using Gemini AI."""

    def __init__(self):
        """Initialize text-to-speech service."""
        self.gemini_service = GeminiService()

    def _create_speech_config(
        self,
        voice_name: VoiceName,
        speed: SpeechSpeed,
        pitch: SpeechPitch,
    ) -> types.SpeechConfig:
        """
        Create speech configuration.

        Args:
            voice_name: Voice to use
            speed: Speech speed
            pitch: Speech pitch

        Returns:
            SpeechConfig: Speech configuration
        """
        return types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name=voice_name.value,
                )
            )
        )

    async def generate_speech(
        self,
        text: str,
        voice_name: VoiceName = VoiceName.KORE,
        speed: SpeechSpeed = SpeechSpeed.NORMAL,
        pitch: SpeechPitch = SpeechPitch.NORMAL,
    ) -> bytes:
        """
        Generate speech from text using Gemini AI.

        Args:
            text: Text to convert to speech
            voice_name: Voice to use
            speed: Speech speed
            pitch: Speech pitch

        Returns:
            bytes: Audio data
        """
        try:
            logger.info(f"Generating speech with voice: {voice_name.value}")

            speech_config = self._create_speech_config(
                voice_name=voice_name,
                speed=speed,
                pitch=pitch,
            )

            response = await self.gemini_service.generate_content(
                content=text,
                model=settings.GEMINI_MODEL_TTS,
                response_modalities=["AUDIO"],
                speech_config=speech_config,
            )

            audio_data = response.candidates[0].content.parts[0].inline_data.data

            logger.info("Speech generation completed")
            return audio_data

        except Exception as e:
            logger.error(f"Speech generation failed: {str(e)}")
            raise Exception(f"Speech generation failed: {str(e)}")

    async def save_audio_file(
        self,
        audio_data: bytes,
        file_path: str,
        channels: int = None,
        rate: int = None,
        sample_width: int = None,
    ) -> None:
        """
        Save audio data to WAV file.

        Args:
            audio_data: Raw audio data
            file_path: Output file path
            channels: Number of audio channels
            rate: Sample rate
            sample_width: Sample width in bytes
        """
        try:
            # Use settings defaults if not provided
            channels = channels or settings.AUDIO_CHANNELS
            rate = rate or settings.AUDIO_SAMPLE_RATE
            sample_width = sample_width or settings.AUDIO_SAMPLE_WIDTH

            with wave.open(file_path, "wb") as wf:
                wf.setnchannels(channels)
                wf.setsampwidth(sample_width)
                wf.setframerate(rate)
                wf.writeframes(audio_data)

            logger.info(f"Audio file saved: {file_path}")

        except Exception as e:
            logger.error(f"Failed to save audio file: {str(e)}")
            raise Exception(f"Failed to save audio file: {str(e)}")
