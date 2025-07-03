"""Gemini Live API service implementation."""

import asyncio
import io
import os
import uuid
import wave
from typing import Any, AsyncGenerator, Dict, Optional

from google import genai
from google.genai import types
from loguru import logger

from src.app.core.config import settings
from src.app.schemas.gemini_live import (
    LiveSessionConfig,
    ResponseModality,
)


class GeminiLiveError(Exception):
    """Custom exception for Gemini Live API failures."""


class GeminiLiveService:
    """
    Service for real-time interactions with Gemini using the Live API.

    This service handles text-to-text, text-to-audio, audio-to-text, and audio-to-audio
    interactions using the Gemini Live API with WebSocket connections.
    """

    def __init__(self):
        """Initialize the Gemini Live service."""
        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY, http_options={"api_version": "v1beta"}
        )
        self.audio_output_dir = settings.AUDIO_OUTPUT_DIR
        os.makedirs(self.audio_output_dir, exist_ok=True)

        # Default models
        self.half_cascade_model = settings.GEMINI_MODEL_LIVE_HALF_CASCADE
        self.native_audio_model = settings.GEMINI_MODEL_LIVE_NATIVE_AUDIO
        self.thinking_model = settings.GEMINI_MODEL_LIVE_THINKING

    def _create_session_config(
        self, session_config: Optional[LiveSessionConfig] = None
    ) -> Dict[str, Any]:
        """
        Create session configuration for Live API.

        Args:
            session_config: Optional session configuration

        Returns:
            Dictionary containing session configuration
        """
        if session_config is None:
            session_config = LiveSessionConfig()

        config = {
            "response_modalities": [session_config.response_modality.value],
        }

        if session_config.system_instruction:
            config["system_instruction"] = session_config.system_instruction

        if session_config.response_modality == ResponseModality.AUDIO:
            speech_config = {}

            if session_config.voice_name:
                speech_config["voice_config"] = {
                    "prebuilt_voice_config": {
                        "voice_name": session_config.voice_name.value
                    }
                }

            if session_config.language_code:
                speech_config["language_code"] = session_config.language_code.value

            if speech_config:
                config["speech_config"] = speech_config

        if session_config.media_resolution:
            config["media_resolution"] = getattr(
                types.MediaResolution, session_config.media_resolution.value
            )

        if session_config.enable_input_audio_transcription:
            config["input_audio_transcription"] = {}

        if session_config.enable_output_audio_transcription:
            config["output_audio_transcription"] = {}

        if session_config.vad_config:
            vad_config = session_config.vad_config
            config["realtime_input_config"] = {
                "automatic_activity_detection": {
                    "disabled": vad_config.disabled,
                }
            }

            if not vad_config.disabled:
                auto_detection = config["realtime_input_config"][
                    "automatic_activity_detection"
                ]
                if vad_config.start_of_speech_sensitivity:
                    auto_detection["start_of_speech_sensitivity"] = getattr(
                        types.StartSensitivity,
                        vad_config.start_of_speech_sensitivity.value,
                    )
                if vad_config.end_of_speech_sensitivity:
                    auto_detection["end_of_speech_sensitivity"] = getattr(
                        types.EndSensitivity, vad_config.end_of_speech_sensitivity.value
                    )
                if vad_config.prefix_padding_ms is not None:
                    auto_detection["prefix_padding_ms"] = vad_config.prefix_padding_ms
                if vad_config.silence_duration_ms is not None:
                    auto_detection["silence_duration_ms"] = (
                        vad_config.silence_duration_ms
                    )

        return config

    def _choose_model(self, session_config: Optional[LiveSessionConfig] = None) -> str:
        """
        Choose the appropriate model based on configuration.

        Args:
            session_config: Session configuration

        Returns:
            Model name to use
        """
        if (
            session_config
            and session_config.response_modality == ResponseModality.AUDIO
        ):
            # For audio responses, prefer native audio models
            return self.native_audio_model
        return self.half_cascade_model

    async def send_text_message(
        self,
        message: str,
        session_config: Optional[LiveSessionConfig] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Send a text message and receive streaming responses.

        Args:
            message: Text message to send
            session_config: Optional session configuration

        Yields:
            Response chunks containing text, audio, or metadata

        Raises:
            GeminiLiveError: If the interaction fails
        """
        try:
            model = self._choose_model(session_config)
            config = self._create_session_config(session_config)

            logger.info("Starting Live API text interaction with model: %s", model)

            async with self.client.aio.live.connect(
                model=model, config=config
            ) as session:
                await session.send_client_content(
                    turns={"role": "user", "parts": [{"text": message}]},
                    turn_complete=True,
                )

                response_data = {
                    "response_id": str(uuid.uuid4()),
                    "text": "",
                    "audio_filename": None,
                    "transcript": None,
                    "usage_metadata": None,
                }

                if config["response_modalities"][0] == "AUDIO":
                    audio_filename = f"live_audio_{uuid.uuid4()}.wav"
                    audio_path = os.path.join(self.audio_output_dir, audio_filename)

                    wf = wave.open(audio_path, "wb")
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(24000)

                    try:
                        async for response in session.receive():
                            if response.text is not None:
                                response_data["text"] += response.text
                                yield {"type": "text", "content": response.text}

                            if response.data is not None:
                                wf.writeframes(response.data)

                            if hasattr(response, "server_content"):
                                if (
                                    response.server_content.output_transcription
                                    and response.server_content.output_transcription.text
                                ):
                                    transcript = response.server_content.output_transcription.text
                                    response_data["transcript"] = transcript
                                    yield {"type": "transcript", "content": transcript}

                                if response.server_content.model_turn:
                                    yield {
                                        "type": "model_turn",
                                        "content": response.server_content.model_turn,
                                    }

                            if (
                                hasattr(response, "usage_metadata")
                                and response.usage_metadata
                            ):
                                response_data["usage_metadata"] = (
                                    response.usage_metadata
                                )
                                yield {
                                    "type": "usage",
                                    "content": response.usage_metadata,
                                }
                    finally:
                        wf.close()
                        response_data["audio_filename"] = audio_filename
                        yield {"type": "final", "content": response_data}
                else:
                    # Text response
                    async for response in session.receive():
                        if response.text is not None:
                            response_data["text"] += response.text
                            yield {"type": "text", "content": response.text}

                        if (
                            hasattr(response, "usage_metadata")
                            and response.usage_metadata
                        ):
                            response_data["usage_metadata"] = response.usage_metadata
                            yield {"type": "usage", "content": response.usage_metadata}

                    yield {"type": "final", "content": response_data}

        except Exception as e:
            logger.error("Error in Live API text interaction: %s", e)
            raise GeminiLiveError(f"Live API interaction failed: {e}") from e

    async def send_audio_message(
        self,
        audio_data: bytes,
        sample_rate: int = 16000,
        session_config: Optional[LiveSessionConfig] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Send audio data and receive streaming responses.

        Args:
            audio_data: Raw audio data (16-bit PCM)
            sample_rate: Audio sample rate
            session_config: Optional session configuration

        Yields:
            Response chunks containing text, audio, or metadata

        Raises:
            GeminiLiveError: If the interaction fails
        """
        try:
            model = self._choose_model(session_config)
            config = self._create_session_config(session_config)

            logger.info("Starting Live API audio interaction with model: %s", model)

            async with self.client.aio.live.connect(
                model=model, config=config
            ) as session:
                await session.send_realtime_input(
                    audio=types.Blob(
                        data=audio_data, mime_type=f"audio/pcm;rate={sample_rate}"
                    )
                )

                response_data = {
                    "response_id": str(uuid.uuid4()),
                    "text": "",
                    "audio_filename": None,
                    "transcript": None,
                    "usage_metadata": None,
                }

                if config["response_modalities"][0] == "AUDIO":
                    audio_filename = f"live_audio_{uuid.uuid4()}.wav"
                    audio_path = os.path.join(self.audio_output_dir, audio_filename)

                    wf = wave.open(audio_path, "wb")
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(24000)

                    try:
                        async for response in session.receive():
                            if response.text is not None:
                                response_data["text"] += response.text
                                yield {"type": "text", "content": response.text}

                            if response.data is not None:
                                wf.writeframes(response.data)

                            if hasattr(response, "server_content"):
                                if (
                                    response.server_content.input_transcription
                                    and response.server_content.input_transcription.text
                                ):
                                    transcript = (
                                        response.server_content.input_transcription.text
                                    )
                                    yield {
                                        "type": "input_transcript",
                                        "content": transcript,
                                    }

                                if (
                                    response.server_content.output_transcription
                                    and response.server_content.output_transcription.text
                                ):
                                    transcript = response.server_content.output_transcription.text
                                    response_data["transcript"] = transcript
                                    yield {
                                        "type": "output_transcript",
                                        "content": transcript,
                                    }

                            if (
                                hasattr(response, "usage_metadata")
                                and response.usage_metadata
                            ):
                                response_data["usage_metadata"] = (
                                    response.usage_metadata
                                )
                                yield {
                                    "type": "usage",
                                    "content": response.usage_metadata,
                                }
                    finally:
                        wf.close()
                        response_data["audio_filename"] = audio_filename
                        yield {"type": "final", "content": response_data}
                else:
                    # Text response
                    async for response in session.receive():
                        if response.text is not None:
                            response_data["text"] += response.text
                            yield {"type": "text", "content": response.text}

                        if hasattr(response, "server_content"):
                            if (
                                response.server_content.input_transcription
                                and response.server_content.input_transcription.text
                            ):
                                transcript = (
                                    response.server_content.input_transcription.text
                                )
                                yield {
                                    "type": "input_transcript",
                                    "content": transcript,
                                }

                        if (
                            hasattr(response, "usage_metadata")
                            and response.usage_metadata
                        ):
                            response_data["usage_metadata"] = response.usage_metadata
                            yield {"type": "usage", "content": response.usage_metadata}

                    yield {"type": "final", "content": response_data}

        except Exception as e:
            logger.error("Error in Live API audio interaction: %s", e)
            raise GeminiLiveError(f"Live API audio interaction failed: {e}") from e

    async def convert_wav_to_pcm(self, wav_file_path: str) -> bytes:
        """
        Convert WAV file to 16-bit PCM format required by Live API.

        Args:
            wav_file_path: Path to WAV file

        Returns:
            Raw PCM audio data

        Raises:
            GeminiLiveError: If conversion fails
        """
        try:
            import librosa
            import soundfile as sf

            # Load audio and resample to 16kHz
            y, sr = librosa.load(wav_file_path, sr=16000)

            # Convert to PCM format
            buffer = io.BytesIO()
            sf.write(buffer, y, sr, format="RAW", subtype="PCM_16")
            buffer.seek(0)

            return buffer.read()

        except ImportError:
            raise GeminiLiveError(
                "librosa and soundfile are required for WAV conversion. "
                "Install with: pip install librosa soundfile"
            )
        except Exception as e:
            logger.error("Error converting WAV to PCM: %s", e)
            raise GeminiLiveError(f"WAV conversion failed: {e}") from e


# Script test functionality
async def test_text_to_text():
    """Test text-to-text interaction."""
    print("=== Testing Text-to-Text ===")
    service = GeminiLiveService()

    config = LiveSessionConfig(
        response_modality=ResponseModality.TEXT,
        system_instruction="You are a helpful assistant. Keep responses brief.",
    )

    async for chunk in service.send_text_message(
        "Hello! How are you today?", session_config=config
    ):
        if chunk["type"] == "text":
            print(chunk["content"], end="", flush=True)
        elif chunk["type"] == "final":
            print(f"\n\nFinal response: {chunk['content']['text']}")
            if chunk["content"]["usage_metadata"]:
                print(f"Usage: {chunk['content']['usage_metadata']}")


async def test_text_to_audio():
    """Test text-to-audio interaction."""
    print("\n=== Testing Text-to-Audio ===")
    service = GeminiLiveService()

    config = LiveSessionConfig(
        response_modality=ResponseModality.AUDIO,
        system_instruction="You are a helpful assistant. Speak in a friendly tone.",
        enable_output_audio_transcription=True,
    )

    async for chunk in service.send_text_message(
        "Please tell me a short joke.", session_config=config
    ):
        if chunk["type"] == "transcript":
            print(f"Transcript: {chunk['content']}")
        elif chunk["type"] == "final":
            print(f"Audio saved to: {chunk['content']['audio_filename']}")
            if chunk["content"]["usage_metadata"]:
                print(f"Usage: {chunk['content']['usage_metadata']}")


async def test_audio_to_text():
    """Test audio-to-text interaction using a test file."""
    print("\n=== Testing Audio-to-Text ===")
    service = GeminiLiveService()

    # Create a simple test audio file (sine wave)
    import numpy as np

    # Generate a 2-second test tone
    sample_rate = 16000
    duration = 2
    frequency = 440  # A4 note

    t = np.linspace(0, duration, int(sample_rate * duration), False)
    wave_data = np.sin(2 * np.pi * frequency * t) * 0.3

    # Convert to 16-bit PCM
    audio_data = (wave_data * 32767).astype(np.int16).tobytes()

    config = LiveSessionConfig(
        response_modality=ResponseModality.TEXT,
        enable_input_audio_transcription=True,
    )

    async for chunk in service.send_audio_message(
        audio_data, sample_rate=sample_rate, session_config=config
    ):
        if chunk["type"] == "text":
            print(chunk["content"], end="", flush=True)
        elif chunk["type"] == "input_transcript":
            print(f"\nInput transcript: {chunk['content']}")
        elif chunk["type"] == "final":
            print(f"\n\nFinal response: {chunk['content']['text']}")


async def main():
    """Main test function."""
    try:
        await test_text_to_text()
        await test_text_to_audio()
        # Note: audio_to_text test requires numpy for generating test audio
        # await test_audio_to_text()

    except Exception as e:
        logger.error("Test failed: %s", e)
        print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
