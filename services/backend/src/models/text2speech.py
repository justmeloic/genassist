"""Text-to-speech data models."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class VoiceName(str, Enum):
    """Available voice names."""

    KORE = "Kore"
    ALG = "Algieba"


class SpeechSpeed(str, Enum):
    """Speech speed options."""

    SLOW = "slow"
    NORMAL = "normal"
    FAST = "fast"


class SpeechPitch(str, Enum):
    """Speech pitch options."""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
