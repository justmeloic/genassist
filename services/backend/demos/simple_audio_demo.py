#!/usr/bin/env python3
"""
Simple Audio-to-Audio Demo for Gemini Live API.

This script demonstrates how to do audio-to-audio interactions:
1. Generate audio using text-to-speech
2. Use that audio as input for audio-to-audio conversation

Run with: python simple_audio_demo.py
"""

import asyncio
import os
import sys
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
    sys.exit(1)


async def generate_initial_audio():
    """Generate some audio using text-to-speech that we can use as input."""
    print("🎵 Step 1: Generating initial audio")
    print("=" * 40)

    service = GeminiLiveService()

    config = LiveSessionConfig(
        response_modality=ResponseModality.AUDIO,
        voice_name=VoiceName.KORE,
        system_instruction="You are a helpful assistant. Speak clearly.",
        enable_output_audio_transcription=True,
    )

    prompt = "Hello! I'm interested in learning about space exploration. Can you tell me something fascinating?"
    print(f"🗣️  Generating audio for: '{prompt}'")

    audio_file = None
    transcript = ""

    async for chunk in service.send_text_message(prompt, session_config=config):
        if chunk["type"] == "transcript":
            transcript = chunk["content"]
            print(f"📝 Generated speech: {transcript}")
        elif chunk["type"] == "final":
            audio_file = chunk["content"]["audio_filename"]
            if audio_file:
                print(f"✅ Audio saved: {audio_file}")

                # Show file info
                audio_path = Path(service.audio_output_dir) / audio_file
                if audio_path.exists():
                    size_kb = audio_path.stat().st_size / 1024
                    print(f"📊 File size: {size_kb:.1f} KB")

    return audio_file, transcript


async def audio_to_audio_conversation(input_audio_file: str, original_transcript: str):
    """Use the generated audio as input for an audio-to-audio conversation."""
    print(f"\n🎤➡️🎵 Step 2: Audio-to-Audio Conversation")
    print("=" * 40)

    service = GeminiLiveService()

    # Convert WAV to PCM
    audio_path = Path(service.audio_output_dir) / input_audio_file

    try:
        print(f"🔄 Converting {input_audio_file} to PCM format...")
        pcm_data = await service.convert_wav_to_pcm(str(audio_path))
        print(f"✅ Converted: {len(pcm_data)} bytes of PCM data")

        # Configure for audio-to-audio with a different voice
        config = LiveSessionConfig(
            response_modality=ResponseModality.AUDIO,
            voice_name=VoiceName.AOEDE,  # Different voice for the response
            system_instruction=(
                "You are having a conversation about space. The person just asked about space exploration. "
                "Respond with additional interesting information, as if continuing the conversation."
            ),
            enable_input_audio_transcription=True,
            enable_output_audio_transcription=True,
        )

        print("🎧 Processing audio input...")
        print(f"🎯 Expected input: '{original_transcript}'")

        input_transcript = ""
        output_transcript = ""
        response_file = None

        async for chunk in service.send_audio_message(pcm_data, session_config=config):
            if chunk["type"] == "input_transcript":
                input_transcript = chunk["content"]
                print(f"📝 AI heard: '{input_transcript}'")
            elif chunk["type"] == "output_transcript":
                output_transcript += chunk["content"]
                print(f"🤖 AI responding: {chunk['content']}")
            elif chunk["type"] == "final":
                response_file = chunk["content"]["audio_filename"]
                usage = chunk["content"].get("usage_metadata")

                print("✅ Audio-to-audio conversation complete!")
                print(f"🎵 Response saved: {response_file}")
                if usage:
                    total_tokens = usage.get("total_token_count", "unknown")
                    print(f"📊 Total tokens used: {total_tokens}")

        # Show conversation summary
        print(f"\n💬 Conversation Summary:")
        print(f"   🎤 Input audio: {input_audio_file}")
        print(f"   📝 What AI heard: '{input_transcript}'")
        print(f"   🎵 Response audio: {response_file}")
        print(f"   📝 What AI said: '{output_transcript}'")

        return response_file

    except Exception as e:
        print(f"❌ Error in audio processing: {e}")
        return None


async def demonstrate_audio_chain():
    """Demonstrate a chain of audio-to-audio interactions."""
    print("\n🔗 Step 3: Audio Chain Demo")
    print("=" * 40)

    # Generate a question
    service = GeminiLiveService()

    config = LiveSessionConfig(
        response_modality=ResponseModality.AUDIO,
        voice_name=VoiceName.PUCK,
        system_instruction="Ask a follow-up question about the topic that was just discussed.",
        enable_output_audio_transcription=True,
    )

    prompt = "Ask a follow-up question about space exploration"
    print(f"🗣️  Generating follow-up question...")

    async for chunk in service.send_text_message(prompt, session_config=config):
        if chunk["type"] == "transcript":
            print(f"❓ Generated question: {chunk['content']}")
        elif chunk["type"] == "final":
            question_file = chunk["content"]["audio_filename"]
            if question_file:
                print(f"🎵 Question audio: {question_file}")

                # Now use this question as input for another response
                print("\n🔄 Using question as input for another response...")

                # Convert and process the question
                audio_path = Path(service.audio_output_dir) / question_file
                pcm_data = await service.convert_wav_to_pcm(str(audio_path))

                answer_config = LiveSessionConfig(
                    response_modality=ResponseModality.AUDIO,
                    voice_name=VoiceName.FENRIR,
                    system_instruction="Answer the question about space exploration with enthusiasm.",
                    enable_input_audio_transcription=True,
                    enable_output_audio_transcription=True,
                )

                async for answer_chunk in service.send_audio_message(
                    pcm_data, session_config=answer_config
                ):
                    if answer_chunk["type"] == "input_transcript":
                        print(f"❓ Question heard: {answer_chunk['content']}")
                    elif answer_chunk["type"] == "output_transcript":
                        print(f"💡 Answer: {answer_chunk['content']}")
                    elif answer_chunk["type"] == "final":
                        answer_file = answer_chunk["content"]["audio_filename"]
                        print(f"🎵 Answer audio: {answer_file}")


async def main():
    """Main demo function."""
    print("🎵 Simple Audio-to-Audio Demo")
    print("=" * 50)

    if not os.getenv("GEMINI_API_KEY"):
        print("❌ GEMINI_API_KEY not set!")
        return

    try:
        # Step 1: Generate initial audio
        audio_file, transcript = await generate_initial_audio()

        if not audio_file:
            print("❌ Failed to generate initial audio")
            return

        # Step 2: Audio-to-audio conversation
        response_file = await audio_to_audio_conversation(audio_file, transcript)

        if response_file:
            # Step 3: Demonstrate audio chaining
            await demonstrate_audio_chain()

        print("\n" + "=" * 50)
        print("🎉 Audio-to-audio demo complete!")
        print("\n📁 Generated files in ./content/audio/:")

        # List generated files
        audio_dir = Path("./content/audio")
        if audio_dir.exists():
            for audio_file in sorted(audio_dir.glob("*.wav")):
                size_kb = audio_file.stat().st_size / 1024
                print(f"   🎵 {audio_file.name} ({size_kb:.1f} KB)")

        print("\n💡 Tips:")
        print("   • Play the audio files to hear the conversation")
        print("   • Each file represents one side of the audio interaction")
        print("   • The AI can understand and respond to its own generated audio")

    except Exception as e:
        print(f"❌ Demo failed: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
