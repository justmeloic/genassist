#!/usr/bin/env python3
"""
Audio Demo for Gemini Live API service.

This script demonstrates audio-to-audio interactions:
1. Generate test audio (text-to-speech)
2. Use that audio as input for audio-to-audio conversation
3. Show real-time microphone input (if available)

Run with: python audio_demo.py

Requirements:
- GEMINI_API_KEY environment variable
- librosa and soundfile: pip install librosa soundfile
- Optional: pyaudio for microphone: pip install pyaudio
"""

import asyncio
import os
import sys
import tempfile
import wave
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    from src.app.schemas.gemini_live import (  # noqa: E402
        LiveSessionConfig,
        ResponseModality,
        VoiceName,
    )
    from src.app.services.gemini_live_service import GeminiLiveService  # noqa: E402
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running from the backend directory")
    sys.exit(1)


def create_test_audio_pcm(
    text: str = "Hello, how are you today?", sample_rate: int = 16000
) -> bytes:
    """Create a simple test audio in PCM format using text-to-speech."""
    import numpy as np

    # Generate a simple sine wave pattern as placeholder
    # In a real scenario, you'd use the TTS service or record actual audio
    duration = len(text) * 0.1  # Rough estimation: 0.1 seconds per character
    t = np.linspace(0, duration, int(sample_rate * duration), False)

    # Create a more speech-like pattern with multiple frequencies
    frequencies = [200, 400, 600, 800]  # Simulate speech formants
    wave_data = np.zeros_like(t)

    for i, freq in enumerate(frequencies):
        amplitude = 0.1 / (i + 1)  # Decreasing amplitude for higher frequencies
        wave_data += amplitude * np.sin(2 * np.pi * freq * t)

    # Add some variation to make it more speech-like
    wave_data *= 1 + 0.3 * np.sin(2 * np.pi * 3 * t)  # Amplitude modulation

    # Convert to 16-bit PCM
    audio_data = (wave_data * 16383).astype(np.int16).tobytes()
    return audio_data


async def demo_text_to_audio_generation():
    """First, generate some audio using text-to-speech."""
    print("🎵 Step 1: Generating audio using text-to-speech")
    print("=" * 50)

    service = GeminiLiveService()

    config = LiveSessionConfig(
        response_modality=ResponseModality.AUDIO,
        voice_name=VoiceName.KORE,
        system_instruction="You are a friendly assistant. Speak clearly and naturally.",
        enable_output_audio_transcription=True,
    )

    prompts = [
        "Hello! Please introduce yourself briefly.",
        "Tell me what you think about artificial intelligence.",
    ]

    generated_files = []

    for i, prompt in enumerate(prompts):
        print(f"\n🗣️  Generating audio for: '{prompt}'")

        async for chunk in service.send_text_message(prompt, session_config=config):
            if chunk["type"] == "transcript":
                print(f"📝 AI said: {chunk['content']}")
            elif chunk["type"] == "final":
                audio_file = chunk["content"]["audio_filename"]
                if audio_file:
                    generated_files.append(audio_file)
                    print(f"✅ Audio saved: {audio_file}")

                    # Show file size
                    audio_path = Path(service.audio_output_dir) / audio_file
                    if audio_path.exists():
                        size_kb = audio_path.stat().st_size / 1024
                        print(f"📊 File size: {size_kb:.1f} KB")

    return generated_files


async def demo_audio_to_audio_with_file(audio_file: str):
    """Demo audio-to-audio using a generated audio file."""
    print(f"\n🎤➡️🎵 Step 2: Audio-to-Audio using {audio_file}")
    print("=" * 50)

    service = GeminiLiveService()

    # Convert the generated WAV file to PCM format
    audio_path = Path(service.audio_output_dir) / audio_file

    try:
        print(f"🔄 Converting {audio_file} to PCM format...")
        pcm_data = await service.convert_wav_to_pcm(str(audio_path))
        print(f"✅ Converted to PCM: {len(pcm_data)} bytes")

        # Configure for audio-to-audio
        config = LiveSessionConfig(
            response_modality=ResponseModality.AUDIO,
            voice_name=VoiceName.AOEDE,  # Use different voice for response
            system_instruction=(
                "You are having a conversation. Listen to what the user says and respond naturally. "
                "Keep your response brief and conversational."
            ),
            enable_input_audio_transcription=True,
            enable_output_audio_transcription=True,
        )

        print("🎧 Processing audio input and generating audio response...")

        response_file = None
        input_transcript = ""
        output_transcript = ""

        async for chunk in service.send_audio_message(pcm_data, session_config=config):
            if chunk["type"] == "input_transcript":
                input_transcript = chunk["content"]
                print(f"📝 Input transcript: {input_transcript}")
            elif chunk["type"] == "output_transcript":
                output_transcript += chunk["content"]
                print(f"🤖 AI transcript: {chunk['content']}")
            elif chunk["type"] == "final":
                response_file = chunk["content"]["audio_filename"]
                usage = chunk["content"].get("usage_metadata")

                print(f"✅ Audio-to-audio complete!")
                print(f"🎵 Response audio saved: {response_file}")
                if usage:
                    print(f"📊 Token usage: {usage}")

        return response_file, input_transcript, output_transcript

    except Exception as e:
        print(f"❌ Error in audio-to-audio processing: {e}")
        return None, "", ""


async def demo_synthetic_audio_to_audio():
    """Demo audio-to-audio using synthetic test audio."""
    print("\n🎤➡️🎵 Step 3: Audio-to-Audio using synthetic audio")
    print("=" * 50)

    service = GeminiLiveService()

    # Create synthetic audio data
    test_message = "Hello, can you help me understand how AI works?"
    print(f"🔊 Creating synthetic audio for: '{test_message}'")

    try:
        import numpy as np

        pcm_data = create_test_audio_pcm(test_message)
        print(f"✅ Generated synthetic PCM data: {len(pcm_data)} bytes")

        config = LiveSessionConfig(
            response_modality=ResponseModality.AUDIO,
            voice_name=VoiceName.FENRIR,
            system_instruction=(
                "You received audio input that might be synthetic or unclear. "
                "Respond as if someone asked about AI, and give a brief, friendly explanation."
            ),
            enable_input_audio_transcription=True,
            enable_output_audio_transcription=True,
        )

        print("🎧 Processing synthetic audio...")

        async for chunk in service.send_audio_message(pcm_data, session_config=config):
            if chunk["type"] == "input_transcript":
                print(f"📝 Input transcript: {chunk['content']}")
            elif chunk["type"] == "output_transcript":
                print(f"🤖 AI response: {chunk['content']}")
            elif chunk["type"] == "final":
                response_file = chunk["content"]["audio_filename"]
                print(f"✅ Response saved: {response_file}")

                # Show conversation summary
                print("\n💬 Conversation Summary:")
                print(f"   Input: Synthetic audio representing '{test_message}'")
                print(f"   Output: Audio response saved to {response_file}")

    except ImportError:
        print("❌ NumPy not available for synthetic audio generation")
        print("Install with: pip install numpy")
    except Exception as e:
        print(f"❌ Error: {e}")


async def demo_microphone_input():
    """Demo real microphone input (if pyaudio is available)."""
    print("\n🎤 Step 4: Real Microphone Input (Optional)")
    print("=" * 50)

    try:
        import threading
        import time

        import pyaudio

        print("🎤 Microphone input available!")
        response = (
            input("Would you like to test microphone input? (y/n): ").strip().lower()
        )

        if response not in ["y", "yes"]:
            print("⏭️  Skipping microphone test")
            return

        service = GeminiLiveService()

        # Audio recording parameters
        CHUNK = 1024
        FORMAT = pyaudio.paInt16
        CHANNELS = 1
        RATE = 16000
        RECORD_SECONDS = 3

        print(f"🎙️  Recording for {RECORD_SECONDS} seconds...")
        print("🗣️  Say something now!")

        # Initialize PyAudio
        audio = pyaudio.PyAudio()

        # Start recording
        stream = audio.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            frames_per_buffer=CHUNK,
        )

        frames = []
        for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
            data = stream.read(CHUNK)
            frames.append(data)
            if i % 5 == 0:  # Progress indicator
                print(f"Recording... {i * CHUNK / RATE:.1f}s")

        stream.stop_stream()
        stream.close()
        audio.terminate()

        # Combine audio data
        audio_data = b"".join(frames)
        print(f"✅ Recorded {len(audio_data)} bytes of audio")

        # Configure for conversation
        config = LiveSessionConfig(
            response_modality=ResponseModality.AUDIO,
            voice_name=VoiceName.KORE,
            system_instruction="You are having a conversation with someone. Respond naturally to what they say.",
            enable_input_audio_transcription=True,
            enable_output_audio_transcription=True,
        )

        print("🤖 Processing your audio...")

        async for chunk in service.send_audio_message(
            audio_data, session_config=config
        ):
            if chunk["type"] == "input_transcript":
                print(f"📝 You said: {chunk['content']}")
            elif chunk["type"] == "output_transcript":
                print(f"🤖 AI replied: {chunk['content']}")
            elif chunk["type"] == "final":
                response_file = chunk["content"]["audio_filename"]
                print(f"🎵 AI response saved: {response_file}")
                print("🎧 You can play this file to hear the AI's voice response!")

    except ImportError:
        print("🔇 PyAudio not available for microphone input")
        print("Install with: pip install pyaudio")
        print("Note: On macOS you might need: brew install portaudio")
    except Exception as e:
        print(f"❌ Microphone error: {e}")


async def main():
    """Main demo function."""
    print("🎵 Gemini Live API - Audio-to-Audio Demo")
    print("=" * 60)

    # Check requirements
    if not os.getenv("GEMINI_API_KEY"):
        print("❌ GEMINI_API_KEY not set!")
        return

    try:
        # Step 1: Generate some audio files first
        generated_files = await demo_text_to_audio_generation()

        # Step 2: Use generated audio for audio-to-audio
        if generated_files:
            await demo_audio_to_audio_with_file(generated_files[0])

        # Step 3: Demo with synthetic audio
        await demo_synthetic_audio_to_audio()

        # Step 4: Optional microphone input
        await demo_microphone_input()

        print("\n" + "=" * 60)
        print("🎉 Audio demo complete!")
        print("📁 Check your audio output directory for generated files:")
        print(f"   ./content/audio/")
        print("\n💡 Tips:")
        print("   • Use headphones to prevent echo/feedback")
        print("   • Audio files are in WAV format, 24kHz")
        print("   • You can play them with any audio player")

    except Exception as e:
        print(f"❌ Demo failed: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
