# Copyright 2025 Loïc Muhirwa
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Text-to-speech data models."""

from enum import Enum


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
