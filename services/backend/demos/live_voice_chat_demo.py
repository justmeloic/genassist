"""
Real-time Voice Chat with Gemini Live API

This script enables live voice conversations with Gemini AI:
- Listens to your microphone in real-time
- Sends audio to Gemini Live API
- Plays AI responses through speakers
- Supports text input as well

Usage: python live_voice_chat.py

Requirements:
- pip install pyaudio
- Use headphones to prevent echo/feedback
- Set GEMINI_API_KEY environment variable

Controls:
- Speak naturally into microphone
- Type 'q' and press Enter to quit
- Press Ctrl+C to exit
"""

import asyncio
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import pyaudio
except ImportError:
    print("❌ PyAudio not installed!")
    print("Install with: pip install pyaudio")
    print("On macOS: brew install portaudio && pip install pyaudio")
    sys.exit(1)

from src.app.schemas.gemini_live import (  # noqa: E402
    LiveSessionConfig,
    ResponseModality,
    VoiceName,
)
from src.app.services.gemini_live_service import GeminiLiveService  # noqa: E402

# Audio configuration
FORMAT = pyaudio.paInt16
CHANNELS = 1
SEND_SAMPLE_RATE = 16000
RECEIVE_SAMPLE_RATE = 24000
CHUNK_SIZE = 1024

pya = pyaudio.PyAudio()


class LiveVoiceChat:
    """Real-time voice chat with Gemini Live API."""

    def __init__(self, voice_name=VoiceName.KORE):
        """Initialize the voice chat system."""
        self.service = GeminiLiveService()
        self.voice_name = voice_name

        # Audio queues
        self.audio_in_queue = None
        self.audio_out_queue = None

        # Audio streams
        self.input_stream = None
        self.output_stream = None

        # Live API session
        self.session = None

        # Session configuration
        self.config = LiveSessionConfig(
            response_modality=ResponseModality.AUDIO,
            voice_name=voice_name,
            system_instruction="""You are a helpful AI assistant having a natural voice conversation. 
            Respond naturally and conversationally. Keep responses concise but friendly. 
            You can be interrupted at any time, so speak naturally.""",
            enable_input_audio_transcription=True,
            enable_output_audio_transcription=True,
        )

    async def setup_audio(self):
        """Set up audio input and output streams."""
        print("🎤 Setting up audio...")

        # Get default audio devices
        try:
            mic_info = pya.get_default_input_device_info()
            speaker_info = pya.get_default_output_device_info()

            print(f"🎤 Microphone: {mic_info['name']}")
            print(f"🔊 Speakers: {speaker_info['name']}")

        except Exception as e:
            print(f"❌ Audio device error: {e}")
            return False

        # Create audio input stream (microphone)
        try:
            self.input_stream = await asyncio.to_thread(
                pya.open,
                format=FORMAT,
                channels=CHANNELS,
                rate=SEND_SAMPLE_RATE,
                input=True,
                input_device_index=mic_info["index"],
                frames_per_buffer=CHUNK_SIZE,
            )
            print("✅ Microphone ready")
        except Exception as e:
            print(f"❌ Microphone setup failed: {e}")
            return False

        # Create audio output stream (speakers)
        try:
            self.output_stream = await asyncio.to_thread(
                pya.open,
                format=FORMAT,
                channels=CHANNELS,
                rate=RECEIVE_SAMPLE_RATE,
                output=True,
            )
            print("✅ Speakers ready")
        except Exception as e:
            print(f"❌ Speaker setup failed: {e}")
            return False

        return True

    async def listen_microphone(self):
        """Continuously listen to microphone and send to Live API."""
        print("🎧 Listening to microphone...")

        kwargs = {"exception_on_overflow": False} if __debug__ else {}

        while True:
            try:
                # Read audio data from microphone
                data = await asyncio.to_thread(
                    self.input_stream.read, CHUNK_SIZE, **kwargs
                )

                # Send to Live API session
                if self.session:
                    await self.session.send_realtime_input(
                        audio={"data": data, "mime_type": "audio/pcm"}
                    )

            except Exception as e:
                print(f"❌ Microphone error: {e}")
                break

    async def play_audio_responses(self):
        """Play audio responses from the AI through speakers."""
        audio_chunk_count = 0
        while True:
            try:
                # Get audio data from queue
                audio_data = await self.audio_out_queue.get()
                audio_chunk_count += 1

                print(
                    f"🔊 Playing audio chunk {audio_chunk_count}: {len(audio_data)} bytes"
                )

                # Debug: Save first few chunks to files for analysis
                if audio_chunk_count <= 3:
                    filename = f"debug_audio_chunk_{audio_chunk_count}.raw"
                    with open(filename, "wb") as f:
                        f.write(audio_data)
                    print(f"💾 Saved audio chunk to {filename}")

                    # Show first few bytes in hex
                    hex_bytes = " ".join([f"{b:02x}" for b in audio_data[:16]])
                    print(f"🔍 First 16 bytes: {hex_bytes}")

                # Play through speakers
                await asyncio.to_thread(self.output_stream.write, audio_data)

            except Exception as e:
                print(f"❌ Audio playback error: {e}")
                break

    async def handle_live_responses(self):
        """Handle responses from the Live API session."""
        print("🤖 Ready to receive AI responses...")
        response_count = 0

        while True:
            try:
                turn = self.session.receive()
                async for response in turn:
                    response_count += 1

                    # Handle audio data
                    if hasattr(response, "data") and response.data:
                        print(
                            f"📥 Response {response_count}: Received audio data ({len(response.data)} bytes)"
                        )
                        await self.audio_out_queue.put(response.data)

                    # Handle text responses (for debugging)
                    if hasattr(response, "text") and response.text:
                        print(f"🤖 AI: {response.text}")

                    # Handle server content parts
                    if hasattr(response, "server_content") and response.server_content:
                        if (
                            response.server_content.model_turn
                            and response.server_content.model_turn.parts
                        ):
                            for i, part in enumerate(
                                response.server_content.model_turn.parts
                            ):
                                if (
                                    hasattr(part, "inline_data")
                                    and part.inline_data
                                    and part.inline_data.data
                                ):
                                    print(
                                        f"📥 Response {response_count}: Model part {i} audio data ({len(part.inline_data.data)} bytes)"
                                    )
                                    await self.audio_out_queue.put(
                                        part.inline_data.data
                                    )
                                if hasattr(part, "text") and part.text:
                                    print(f"🤖 AI text part {i}: {part.text}")

                        # Handle transcriptions
                        if (
                            response.server_content.input_transcription
                            and response.server_content.input_transcription.text
                        ):
                            transcript = (
                                response.server_content.input_transcription.text
                            )
                            print(f"🎤 You said: {transcript}")

                        if (
                            response.server_content.output_transcription
                            and response.server_content.output_transcription.text
                        ):
                            transcript = (
                                response.server_content.output_transcription.text
                            )
                            print(f"🗣️  AI said: {transcript}")

                # Handle interruptions - clear audio queue
                while not self.audio_out_queue.empty():
                    try:
                        self.audio_out_queue.get_nowait()
                    except asyncio.QueueEmpty:
                        break

            except Exception as e:
                print(f"❌ Response handling error: {e}")
                break

    async def handle_text_input(self):
        """Handle text input for when user wants to type instead of speak."""
        while True:
            try:
                text = await asyncio.to_thread(
                    input, "\nType message (or 'q' to quit): "
                )

                if text.lower().strip() in ["q", "quit", "exit"]:
                    print("👋 Goodbye!")
                    return

                if text.strip():
                    if self.session:
                        await self.session.send_client_content(
                            turns={"role": "user", "parts": [{"text": text}]},
                            turn_complete=True,
                        )

            except (EOFError, KeyboardInterrupt):
                print("\n👋 Goodbye!")
                return
            except Exception as e:
                print(f"❌ Text input error: {e}")

    async def start_conversation(self):
        """Start the live voice conversation."""
        print("\n🚀 STARTING LIVE VOICE CHAT")
        print("=" * 50)
        print("🎤 Speak into your microphone")
        print("⌨️  Or type messages and press Enter")
        print("🛑 Press Ctrl+C or type 'q' to quit")
        print("=" * 50)

        # Set up audio
        if not await self.setup_audio():
            return

        try:
            # Connect to Live API
            async with self.service.client.aio.live.connect(
                model=self.service.native_audio_model,
                config=self.service._create_session_config(self.config),
            ) as session:
                self.session = session

                # Create audio queues
                self.audio_out_queue = asyncio.Queue()

                # Start all tasks
                async with asyncio.TaskGroup() as tg:
                    # Audio tasks
                    tg.create_task(self.listen_microphone())
                    tg.create_task(self.play_audio_responses())
                    tg.create_task(self.handle_live_responses())

                    # Text input task (this will exit when user types 'q')
                    text_task = tg.create_task(self.handle_text_input())

                    # Wait for text task to complete (user quits)
                    await text_task

                    # Cancel other tasks
                    raise asyncio.CancelledError("User requested exit")

        except asyncio.CancelledError:
            print("🛑 Conversation ended")
        except Exception as e:
            print(f"❌ Conversation error: {e}")
            import traceback

            traceback.print_exc()
        finally:
            # Clean up audio streams
            if self.input_stream:
                self.input_stream.close()
            if self.output_stream:
                self.output_stream.close()

    def cleanup(self):
        """Clean up resources."""
        try:
            if self.input_stream:
                self.input_stream.close()
            if self.output_stream:
                self.output_stream.close()
            pya.terminate()
        except Exception:
            pass


async def main():
    """Main function."""
    print("🎙️  GEMINI LIVE API - REAL-TIME VOICE CHAT")
    print("=" * 60)

    # Check API key
    if not os.getenv("GEMINI_API_KEY"):
        print("❌ GEMINI_API_KEY environment variable not set!")
        print("Set with: export GEMINI_API_KEY='your-api-key-here'")
        return

    # Check audio dependencies
    try:
        pya.get_device_count()
    except Exception as e:
        print(f"❌ Audio system error: {e}")
        print("Make sure your audio devices are working")
        return

    print("⚠️  IMPORTANT: Use headphones to prevent echo/feedback!")
    input("Press Enter when you have headphones on and are ready to start...")

    # Choose voice
    print("\n🗣️  Choose AI voice:")
    voices = list(VoiceName)
    for i, voice in enumerate(voices, 1):
        print(f"   {i}. {voice.value}")

    try:
        choice = input(
            f"\nSelect voice (1-{len(voices)}) or press Enter for default: "
        ).strip()
        if choice and choice.isdigit() and 1 <= int(choice) <= len(voices):
            selected_voice = voices[int(choice) - 1]
        else:
            selected_voice = VoiceName.KORE

        print(f"✅ Selected voice: {selected_voice.value}")

    except (ValueError, KeyboardInterrupt):
        selected_voice = VoiceName.KORE
        print(f"✅ Using default voice: {selected_voice.value}")

    # Start the chat
    chat = LiveVoiceChat(voice_name=selected_voice)

    try:
        await chat.start_conversation()
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    finally:
        chat.cleanup()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    finally:
        # Final cleanup
        try:
            pya.terminate()
        except Exception:
            pass
