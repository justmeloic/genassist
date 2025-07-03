#!/usr/bin/env python3
"""
Simple test script for Gemini Live API service.

This script demonstrates how to use the GeminiLiveService for different interaction types:
- Text-to-text chat
- Text-to-audio conversion
- Audio-to-text transcription (requires audio file)

Usage:
    python test_live_service.py

Before running:
1. Set GEMINI_API_KEY environment variable
2. Ensure audio output directory exists
3. Install dependencies: pip install librosa soundfile

"""

import asyncio
import os
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Import after path setup
from src.app.schemas.gemini_live import (  # noqa: E402
    LiveSessionConfig,
    ResponseModality,
    VoiceName,
)
from src.app.services.gemini_live_service import GeminiLiveService  # noqa: E402


async def test_simple_chat():
    """Test basic text-to-text chat."""
    print("🗣️  Testing Text-to-Text Chat")
    print("=" * 50)

    service = GeminiLiveService()

    config = LiveSessionConfig(
        response_modality=ResponseModality.TEXT,
        system_instruction="You are a helpful assistant. Keep responses concise and friendly.",
    )

    questions = [
        "Hello! What's the weather like on Mars?",
        "Tell me a fun fact about space.",
        "What's 25 * 37?",
    ]

    for question in questions:
        print(f"\n🤔 Question: {question}")
        print("🤖 Response: ", end="", flush=True)

        full_response = ""
        async for chunk in service.send_text_message(question, session_config=config):
            if chunk["type"] == "text":
                print(chunk["content"], end="", flush=True)
                full_response += chunk["content"]
            elif chunk["type"] == "final":
                usage = chunk["content"].get("usage_metadata")
                if usage:
                    print(f"\n📊 Tokens used: {usage}")

        print("\n" + "-" * 40)


async def test_text_to_speech():
    """Test text-to-audio conversion."""
    print("\n🎵 Testing Text-to-Audio")
    print("=" * 50)

    service = GeminiLiveService()

    config = LiveSessionConfig(
        response_modality=ResponseModality.AUDIO,
        voice_name=VoiceName.KORE,
        system_instruction="You are a friendly assistant. Speak clearly and enthusiastically.",
        enable_output_audio_transcription=True,
    )

    prompts = [
        "Please introduce yourself in a friendly way.",
        "Tell me a short poem about coding.",
    ]

    for prompt in prompts:
        print(f"\n🗣️  Prompt: {prompt}")

        audio_file = None
        transcript = ""

        async for chunk in service.send_text_message(prompt, session_config=config):
            if chunk["type"] == "transcript":
                print(f"📝 Transcript: {chunk['content']}")
                transcript += chunk["content"]
            elif chunk["type"] == "final":
                audio_file = chunk["content"]["audio_filename"]
                usage = chunk["content"].get("usage_metadata")
                print(f"🎵 Audio saved: {audio_file}")
                if usage:
                    print(f"📊 Tokens used: {usage}")

        print("-" * 40)


async def test_audio_to_text():
    """Test audio-to-text if we have an audio file."""
    print("\n🎤 Testing Audio-to-Text")
    print("=" * 50)

    # Look for any existing audio files in the audio output directory
    from src.app.core.config import settings

    audio_dir = Path(settings.AUDIO_OUTPUT_DIR)
    audio_files = list(audio_dir.glob("*.wav"))

    if not audio_files:
        print("⚠️  No audio files found for testing. Skipping audio-to-text test.")
        print("   Run text-to-speech test first to generate audio files.")
        return

    # Use the first audio file we find
    test_file = audio_files[0]
    print(f"🎵 Using audio file: {test_file.name}")

    service = GeminiLiveService()

    try:
        # Convert WAV to PCM
        pcm_data = await service.convert_wav_to_pcm(str(test_file))

        config = LiveSessionConfig(
            response_modality=ResponseModality.TEXT,
            enable_input_audio_transcription=True,
            system_instruction="Please describe what you hear in the audio.",
        )

        print("🎧 Processing audio...")

        async for chunk in service.send_audio_message(pcm_data, session_config=config):
            if chunk["type"] == "text":
                print("🤖 Response: ", end="", flush=True)
                print(chunk["content"], end="", flush=True)
            elif chunk["type"] == "input_transcript":
                print(f"\n📝 Input transcript: {chunk['content']}")
            elif chunk["type"] == "final":
                usage = chunk["content"].get("usage_metadata")
                if usage:
                    print(f"\n📊 Tokens used: {usage}")

    except Exception as e:
        print(f"❌ Error in audio processing: {e}")
        print("   Make sure librosa and soundfile are installed:")
        print("   pip install librosa soundfile")


async def interactive_chat():
    """Interactive chat mode."""
    print("\n💬 Interactive Chat Mode")
    print("=" * 50)
    print("Type 'quit' to exit, 'audio' to switch to audio mode")

    service = GeminiLiveService()

    config = LiveSessionConfig(
        response_modality=ResponseModality.TEXT,
        system_instruction="You are a helpful AI assistant. Provide conversational responses.",
    )

    while True:
        try:
            user_input = input("\n🧑 You: ").strip()

            if user_input.lower() in ["quit", "exit", "q"]:
                print("👋 Goodbye!")
                break

            if user_input.lower() == "audio":
                config.response_modality = ResponseModality.AUDIO
                config.enable_output_audio_transcription = True
                print(
                    "🎵 Switched to audio mode. Responses will be saved as audio files."
                )
                continue

            if user_input.lower() == "text":
                config.response_modality = ResponseModality.TEXT
                config.enable_output_audio_transcription = False
                print("📝 Switched to text mode.")
                continue

            if not user_input:
                continue

            print("🤖 Assistant: ", end="", flush=True)

            async for chunk in service.send_text_message(
                user_input, session_config=config
            ):
                if chunk["type"] == "text":
                    print(chunk["content"], end="", flush=True)
                elif chunk["type"] == "transcript":
                    print(f"\n📝 Audio transcript: {chunk['content']}")
                elif chunk["type"] == "final":
                    if chunk["content"]["audio_filename"]:
                        print(f"\n🎵 Audio saved: {chunk['content']['audio_filename']}")

        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")


async def main():
    """Main function to run all tests."""
    print("🚀 Gemini Live API Service Test")
    print("=" * 50)

    # Check if API key is set
    if not os.getenv("GEMINI_API_KEY"):
        print("❌ Error: GEMINI_API_KEY environment variable not set!")
        print("Please set your API key:")
        print("export GEMINI_API_KEY='your-api-key-here'")
        return

    try:
        # Run basic tests
        await test_simple_chat()
        await test_text_to_speech()
        await test_audio_to_text()

        # Ask if user wants interactive mode
        print("\n" + "=" * 50)
        response = (
            input("Would you like to try interactive chat? (y/n): ").strip().lower()
        )
        if response in ["y", "yes"]:
            await interactive_chat()

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
