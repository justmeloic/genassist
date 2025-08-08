/**
 * Copyright 2025 Loïc Muhirwa
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface SpeakerModeDialogProps {
  onSelect: (isMultiSpeaker: boolean) => void;
  onClose: () => void;
}

export default function SpeakerModeDialog({
  onSelect,
  onClose,
}: SpeakerModeDialogProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card rounded-3xl p-6 shadow-card-normal dark:border border-border w-full max-w-md">
        <div className="flex items-center justify-between mb-6 opacity-65">
          <h2 className="text-xl ml-4">Select Speech Mode</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full  hover:bg-gradient-to-r hover:from-blue-500/50 hover:to-pink-500/50 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSelect(false)}
            className="p-4 opacity-65 border border-border rounded-2xl hover:bg-gradient-to-r hover:from-blue-500/50 hover:to-pink-500/50 hover:text-white transition-colors"
          >
            <h3 className="font-medium mb-2 ">Single Speaker</h3>
            <p className="text-xs  ">Convert text using a single voice</p>
          </button>

          <button
            onClick={() => onSelect(true)}
            className="p-4 opacity-65 border border-border rounded-2xl hover:bg-gradient-to-r hover:from-blue-500/50 hover:to-pink-500/50 hover:text-white transition-colors"
          >
            <h3 className="font-medium mb-2 ">Multi Speaker</h3>
            <p className="text-xs ">Use different voices for dialogue</p>
          </button>
        </div>
      </div>
    </div>
  );
}
