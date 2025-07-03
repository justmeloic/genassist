#!/usr/bin/env python3
"""
Complete Audio-to-Audio Demo for Gemini Live API

This demonstrates full audio-to-audio conversations:
1. Takes existing audio files as input
2. Sends them to Gemini Live API
3. Gets audio responses back
4. Shows transcriptions of both sides

Usage: python full_audio_demo.py
"""

import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.app.schemas.gemini_live import (  # noqa: E402
    LiveSessionConfig,
    ResponseModality,
    VoiceName,
)
from src.app.services.gemini_live_service import GeminiLiveService  # noqa: E402


async def run_audio_to_audio_demo():
    """Complete audio-to-audio conversation demo."""
    print("🎵 GEMINI LIVE API - AUDIO TO AUDIO DEMO")
    print("=" * 60)

    service = GeminiLiveService()

    # Check for existing audio files
    from src.app.core.config import settings

    audio_dir = Path(settings.AUDIO_OUTPUT_DIR)
    audio_files = list(audio_dir.glob("*.wav"))

    if not audio_files:
        print("❌ No audio files found!")
        print("Let me create one first with text-to-speech...")

        # Create an audio file first
        config = LiveSessionConfig(
            response_modality=ResponseModality.AUDIO,
            voice_name=VoiceName.KORE,
            enable_output_audio_transcription=True,
        )

        print("🎤 Creating initial audio file...")
        async for chunk in service.send_text_message(
            "Hello, I have a question about artificial intelligence. Can you help me understand how neural networks work?",
            session_config=config,
        ):
            if chunk["type"] == "final":
                print(f"✅ Created audio file: {chunk['content']['audio_filename']}")
                audio_files = [audio_dir / chunk["content"]["audio_filename"]]
                break

    # Use the first/newest audio file
    input_audio_file = audio_files[0]
    print(f"\n🎧 Using audio input: {input_audio_file.name}")
    print(f"📊 File size: {input_audio_file.stat().st_size / 1024:.1f} KB")

    try:
        # Convert to PCM format
        print("\n🔄 Converting audio to PCM format...")
        pcm_data = await service.convert_wav_to_pcm(str(input_audio_file))
        print(f"✅ Converted {len(pcm_data):,} bytes of PCM audio data")

        # Configure for audio-to-audio
        config = LiveSessionConfig(
            response_modality=ResponseModality.AUDIO,
            voice_name=VoiceName.AOEDE,  # Try a different voice
            system_instruction="""You are a helpful AI assistant having a natural conversation. 
            Please listen carefully to the audio input and respond in a friendly, conversational way. 
            If someone asks a question, provide a clear and helpful answer.""",
            enable_input_audio_transcription=True,
            enable_output_audio_transcription=True,
        )

        print("\n🚀 Starting audio-to-audio conversation...")
        print("🎧 Sending audio to Gemini...")

        # Track the conversation
        input_transcript = ""
        output_transcript = ""
        response_audio_file = None

        async for chunk in service.send_audio_message(pcm_data, session_config=config):
            if chunk["type"] == "input_transcript":
                input_transcript += chunk["content"]
                print(f"\n📝 INPUT TRANSCRIPT: {chunk['content']}")

            elif chunk["type"] == "output_transcript":
                output_transcript += chunk["content"]
                print(f"🗣️  AI RESPONSE: {chunk['content']}", end="", flush=True)

            elif chunk["type"] == "text":
                print(chunk["content"], end="", flush=True)

            elif chunk["type"] == "usage":
                print(f"\n📊 Token Usage: {chunk['content']}")

            elif chunk["type"] == "final":
                response_audio_file = chunk["content"]["audio_filename"]
                print("\n\n✅ CONVERSATION COMPLETE!")
                break

        # Show results
        print("\n" + "=" * 60)
        print("📋 CONVERSATION SUMMARY:")
        print("=" * 60)
        print(f"🎤 HUMAN (from audio): {input_transcript}")
        print(f"🤖 AI RESPONSE: {output_transcript}")
        print(f"🎵 Response audio saved: {response_audio_file}")

        # Show all audio files
        updated_files = sorted(audio_dir.glob("*.wav"), key=lambda x: x.stat().st_mtime)
        print(f"\n📁 ALL AUDIO FILES ({len(updated_files)} total):")
        for i, f in enumerate(updated_files, 1):
            size_kb = f.stat().st_size / 1024
            age = (
                "📄 Input"
                if f == input_audio_file
                else "🆕 Output"
                if f.name == response_audio_file
                else "📜 Other"
            )
            print(f"   {i}. {f.name} ({size_kb:.1f} KB) {age}")

        print("\n🎧 You can play these audio files to hear the conversation!")
        print(f"   Input:  {input_audio_file}")
        print(f"   Output: {audio_dir / response_audio_file}")

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback

        traceback.print_exc()


async def demo_audio_conversation_chain():
    """Demo a chain of audio conversations."""
    print("\n🔄 AUDIO CONVERSATION CHAIN DEMO")
    print("=" * 60)

    service = GeminiLiveService()

    # Questions to ask in sequence
    questions = [
        "What is machine learning and how does it work?",
        "Can you give me a simple example of machine learning in everyday life?",
        "Thank you! That was very helpful.",
    ]

    config = LiveSessionConfig(
        response_modality=ResponseModality.AUDIO,
        voice_name=VoiceName.FENRIR,  # Try another voice
        system_instruction="You are an AI teacher. Provide clear, friendly explanations.",
        enable_output_audio_transcription=True,
    )

    for i, question in enumerate(questions, 1):
        print(f"\n🔄 TURN {i}/3:")
        print(f"🧑 HUMAN: {question}")
        print("🤖 AI: ", end="", flush=True)

        response_transcript = ""

        async for chunk in service.send_text_message(question, session_config=config):
            if chunk["type"] == "transcript":
                print(chunk["content"], end="", flush=True)
                response_transcript += chunk["content"]

            elif chunk["type"] == "final":
                audio_file = chunk["content"]["audio_filename"]
                print(f"\n   🎵 Audio: {audio_file}")
                break

        # Brief pause between questions
        if i < len(questions):
            await asyncio.sleep(0.5)

    print("\n✅ Conversation chain complete!")


async def main():
    """Main demo function."""
    try:
        # Run the complete audio-to-audio demo
        await run_audio_to_audio_demo()

        # Run a conversation chain
        await demo_audio_conversation_chain()

        print("\n" + "=" * 60)
        print("🎉 ALL AUDIO DEMOS COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("💡 What you can do now:")
        print("   • Play the audio files to hear the AI responses")
        print("   • Use different voices by changing VoiceName")
        print("   • Try the interactive test with: python test_live_service.py")
        print("   • Build a real-time voice chat application!")

    except Exception as e:
        print(f"❌ Demo failed: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
