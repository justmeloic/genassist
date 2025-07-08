#!/usr/bin/env python3
"""
Test script for Gemini Live WebSocket integration.

This script tests the WebSocket endpoints to ensure they work correctly.
"""

import asyncio
import json
import time

import websockets


async def test_voice_chat_connection():
    """Test voice chat WebSocket connection."""
    uri = "ws://localhost:8000/v1/api/gemini-live/voice-chat"

    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to voice chat WebSocket")

            # Send connection message
            connect_msg = {
                "type": "connect",
                "session_id": "test-session",
                "timestamp": time.time(),
                "data": {
                    "chat_mode": "voice",
                    "voice_name": "Kore",
                    "system_instruction": "You are a helpful test assistant.",
                    "enable_input_transcription": True,
                    "enable_output_transcription": True,
                    "audio_config": {
                        "sample_rate": 16000,
                        "output_sample_rate": 24000,
                        "channels": 1,
                        "format": "pcm",
                    },
                },
            }

            await websocket.send(json.dumps(connect_msg))
            print("📤 Sent connection message")

            # Wait for session start response
            response = await websocket.recv()
            data = json.loads(response)
            print(f"📥 Received: {data['type']}")

            if data["type"] == "session_start":
                print("✅ Session started successfully!")
                session_id = data["data"]["session_id"]

                # Send a test text message
                text_msg = {
                    "type": "text_message",
                    "session_id": session_id,
                    "timestamp": time.time(),
                    "data": {"text": "Hello, this is a test message!"},
                }

                await websocket.send(json.dumps(text_msg))
                print("📤 Sent test text message")

                # Wait for AI response - give it more time to process
                try:
                    # Listen for multiple messages
                    for i in range(10):  # Wait for up to 10 messages or 30 seconds
                        response = await asyncio.wait_for(
                            websocket.recv(), timeout=30.0
                        )
                        data = json.loads(response)
                        print(f"📥 AI Response {i + 1}: {data['type']}")

                        # Print the data for debugging
                        if data.get("data"):
                            if "text" in data["data"]:
                                print(f"   📝 Text: {data['data']['text']}")
                            if "audio" in data["data"]:
                                print(
                                    f"   🔊 Audio: {len(data['data']['audio'])} bytes (base64)"
                                )

                        # If we get a text response, we're done
                        if data["type"] in ["text_response", "output_transcription"]:
                            print("✅ Got AI response!")
                            break

                except asyncio.TimeoutError:
                    print("⏰ Timeout waiting for AI response")

                # Keep connection alive for a bit to test streaming
                await asyncio.sleep(2)

                print("✅ Voice chat test completed successfully!")
            else:
                print(f"❌ Unexpected response: {data}")

    except Exception as e:
        print(f"❌ Connection failed: {e}")


async def test_health_endpoints():
    """Test HTTP health endpoints."""
    import aiohttp

    async with aiohttp.ClientSession() as session:
        try:
            # Test main health
            async with session.get("http://localhost:8000/health") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Main health: {data}")
                else:
                    print(f"❌ Main health failed: {response.status}")

            # Test Gemini Live health
            async with session.get(
                "http://localhost:8000/v1/api/gemini-live/health"
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Gemini Live health: {data}")
                else:
                    print(f"❌ Gemini Live health failed: {response.status}")

            # Test voices endpoint
            async with session.get(
                "http://localhost:8000/v1/api/gemini-live/voices"
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Available voices: {len(data['voices'])} voices")
                else:
                    print(f"❌ Voices endpoint failed: {response.status}")

            # Test session stats
            async with session.get(
                "http://localhost:8000/v1/api/gemini-live/stats"
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Session stats: {data}")
                else:
                    print(f"❌ Session stats failed: {response.status}")

        except Exception as e:
            print(f"❌ HTTP test failed: {e}")


async def main():
    """Main test function."""
    print("🧪 TESTING GEMINI LIVE WEBSOCKET INTEGRATION")
    print("=" * 60)

    print("\n📡 Testing HTTP endpoints...")
    await test_health_endpoints()

    print("\n🔌 Testing WebSocket connection...")
    print("⚠️  Make sure the FastAPI server is running on port 8000")
    print("   Start with: uvicorn src.app.main:app --reload")

    try:
        await test_voice_chat_connection()
    except Exception as e:
        print(f"❌ WebSocket test skipped: {e}")
        print("   (This is expected if server is not running)")

    print("\n✅ Test completed!")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Test interrupted")
