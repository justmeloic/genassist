"""Text-to-speech service implementation."""

import wave
from typing import List, Optional

from google import genai
from google.genai import types
from loguru import logger

from app.core.config import settings
from app.models.text2speech import SpeechPitch, SpeechSpeed, VoiceName
from app.schemas.text2speech import SpeakerConfig
from app.services.gemini_service import GeminiService


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

    def _create_multi_speaker_config(
        self,
        speakers: List[SpeakerConfig],
    ) -> types.SpeechConfig:
        """Create multi-speaker speech configuration."""
        speaker_configs = [
            types.SpeakerVoiceConfig(
                speaker=speaker.speaker,
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=speaker.voice_name.value,
                    )
                ),
            )
            for speaker in speakers
        ]

        return types.SpeechConfig(
            multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
                speaker_voice_configs=speaker_configs
            )
        )

    def _format_multi_speaker_text(self, text: str) -> str:
        """Format text for multi-speaker TTS."""
        if not text.startswith("TTS the following conversation"):
            return f"""TTS the following conversation:
{text}"""
        return text

    async def generate_speech(
        self,
        text: str,
        is_multi_speaker: bool = False,
        voice_name: Optional[VoiceName] = VoiceName.KORE,
        speakers: Optional[List[SpeakerConfig]] = None,
        speed: SpeechSpeed = SpeechSpeed.NORMAL,
        pitch: SpeechPitch = SpeechPitch.NORMAL,
    ) -> bytes:
        """
        Generate speech from text using Gemini AI.

        Args:
            text: Text to convert to speech
            is_multi_speaker: Whether to use multi-speaker TTS
            voice_name: Voice to use for single speaker TTS
            speakers: Speaker configurations for multi-speaker TTS
            speed: Speech speed
            pitch: Speech pitch

        Returns:
            bytes: Audio data
        """
        try:
            logger.info(
                f"Generating {'multi-speaker' if is_multi_speaker else 'single-speaker'} speech"
            )

            # Use default speakers if none provided for multi-speaker
            if is_multi_speaker and not speakers:
                speakers = [
                    SpeakerConfig(**speaker_config)
                    for speaker_config in settings.DEFAULT_SPEAKERS
                ]

            formatted_text = (
                self._format_multi_speaker_text(text) if is_multi_speaker else text
            )
            speech_config = (
                self._create_multi_speaker_config(speakers)
                if is_multi_speaker
                else self._create_speech_config(voice_name, speed, pitch)
            )

            model = (
                settings.GEMINI_MODEL_MULTI_TTS
                if is_multi_speaker
                else settings.GEMINI_MODEL_TTS
            )

            response = await self.gemini_service.generate_content(
                content=formatted_text,
                model=model,
                response_modalities=["AUDIO"],
                speech_config=speech_config,
            )

            if not response or not response.candidates:
                raise Exception("No response from Gemini API")

            candidate = response.candidates[0]
            if not candidate.content or not candidate.content.parts:
                raise Exception("Invalid response structure from Gemini API")

            part = candidate.content.parts[0]
            if (
                not hasattr(part, "inline_data")
                or not part.inline_data
                or not part.inline_data.data
            ):
                raise Exception("No audio data in response")

            audio_data = part.inline_data.data
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
