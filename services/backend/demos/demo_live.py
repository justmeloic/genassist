#!/usr/bin/env python3
"""
Quick demo of Gemini Live API service functionality.

This script provides a minimal example of how to use the service.
Run with: python demo_live.py

Requires:
- GEMINI_API_KEY environment variable
- Audio output directory configured
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
    )
    from src.app.services.gemini_live_service import GeminiLiveService  # noqa: E402
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running from the backend directory")
    sys.exit(1)


async def quick_demo():
    """Quick demonstration of the Live API service."""
    print("🚀 Gemini Live API Quick Demo")
    print("=" * 40)

    # Check API key
    if not os.getenv("GEMINI_API_KEY"):
        print("❌ GEMINI_API_KEY not set!")
        print("Set with: export GEMINI_API_KEY='your-key'")
        return

    # Initialize service
    try:
        service = GeminiLiveService()
        print("✅ Service initialized")
    except Exception as e:
        print(f"❌ Service initialization failed: {e}")
        return

    # Simple text chat
    print("\n🗣️  Testing simple text interaction...")

    config = LiveSessionConfig(
        response_modality=ResponseModality.TEXT,
        system_instruction="You are a helpful assistant. Keep responses brief.",
    )

    try:
        full_response = ""
        async for chunk in service.send_text_message(
            "Hello! Can you tell me a fun fact?", session_config=config
        ):
            if chunk["type"] == "text":
                print(chunk["content"], end="", flush=True)
                full_response += chunk["content"]
            elif chunk["type"] == "final":
                print("\n\n✅ Response complete!")
                usage = chunk["content"].get("usage_metadata")
                if usage:
                    print(f"📊 Token usage: {usage}")
                break

    except Exception as e:
        print(f"\n❌ Error: {e}")

    print("\n" + "=" * 40)
    print("Demo complete! Check GEMINI_LIVE_README.md for full documentation.")


if __name__ == "__main__":
    asyncio.run(quick_demo())
