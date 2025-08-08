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

"""Document edit data models."""

from enum import Enum


class DocumentType(str, Enum):
    """Document type enumeration."""

    GENERAL = "general"
    ACADEMIC = "academic"
    BUSINESS = "business"
    TECHNICAL = "technical"
    CREATIVE = "creative"


class EditInstruction(str, Enum):
    """Edit instruction type enumeration."""

    GRAMMAR_CHECK = "grammar_check"
    STYLE_IMPROVEMENT = "style_improvement"
    CONTENT_ENHANCEMENT = "content_enhancement"
    SUMMARIZATION = "summarization"
    EXPANSION = "expansion"
    TRANSLATION = "translation"
    CUSTOM = "custom"
