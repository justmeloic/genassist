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
import {
  ArrowLeft,
  Brain,
  Camera,
  MessageCircle,
  Mic,
  MonitorSpeaker,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface ChatMode {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  features: string[];
  comingSoon?: boolean;
}

const chatModes: ChatMode[] = [
  {
    id: "voice-chat",
    title: "Voice Chat",
    description: "Real-time voice conversation with AI assistant",
    icon: <Mic className="w-8 h-8" />,
    color: "text-blue-500",
    gradient: "from-blue-500 to-purple-500",
    features: [
      "Natural voice conversations",
      "Real-time audio processing",
      "Multi-language support",
      "Voice activity detection",
    ],
  },
  {
    id: "screen-share",
    title: "Screen Share",
    description: "Share your screen while chatting with AI",
    icon: <MonitorSpeaker className="w-8 h-8" />,
    color: "text-green-500",
    gradient: "from-green-500 to-emerald-500",
    features: [
      "Live screen sharing",
      "Visual context understanding",
      "Real-time collaboration",
      "Screen annotation support",
    ],
  },
  {
    id: "camera-chat",
    title: "Camera Chat",
    description: "Video conversation with visual AI interaction",
    icon: <Camera className="w-8 h-8" />,
    color: "text-pink-500",
    gradient: "from-pink-500 to-rose-500",
    features: [
      "Face-to-face conversations",
      "Visual recognition",
      "Gesture understanding",
      "Real-time video processing",
    ],
  },
];

export default function ChatModePage() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const handleModeSelect = (modeId: string) => {
    setSelectedMode(modeId);
    // Navigate to the specific chat interface
    const routes = {
      "voice-chat": "/live/voice-chat",
      "screen-share": "/live/screen-share",
      "camera-chat": "/live/camera-chat",
    };
    window.location.href = routes[modeId as keyof typeof routes];
  };

  return (
    <div className="flex flex-col flex-1 h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4  border-gray-200 dark:border-gray-700">
        <Link
          href="/"
          className="p-3 bg-blue-100 dark:bg-gray-700 rounded-full hover:bg-blue-200 dark:hover:bg-gray-600 transition-all duration-300 shadow-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <div className="w-[120px]" /> {/* Spacer for balance */}
      </div>

      <main className="flex-1 flex flex-col items-center justify-start w-full relative px-4 pt-24">
        <div className="max-w-6xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Image
                src="/logo-avatar-icon.png"
                alt="Logo"
                width={32}
                height={32}
                className="animate-bounce"
              />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
                Choose Your Experience
              </h1>
            </div>
            <p className="text-base bg-gradient-to-r from-blue-500 to-pink-500  bg-clip-text text-transparent max-w-2xl mx-auto">
              State-of-the-art AI interaction with real-time voice, screen
              sharing, and video capabilities
            </p>
          </div>

          {/* Chat Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {chatModes.map((mode) => (
              <div
                key={mode.id}
                className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedMode === mode.id ? "scale-105" : ""
                }`}
                onClick={() => handleModeSelect(mode.id)}
              >
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Card Header */}
                  <div
                    className={`p-6 bg-gradient-to-br ${mode.gradient} text-white`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                        {mode.icon}
                      </div>
                      <h3 className="text-xl font-semibold">{mode.title}</h3>
                    </div>
                    <p className="text-white/90 text-sm">{mode.description}</p>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Key Features:
                    </h4>
                    <ul className="space-y-2">
                      {mode.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                        >
                          <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 pb-6">
                    <button
                      className={`w-full py-3 px-4 bg-gradient-to-r ${mode.gradient} text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Start {mode.title}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Info Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-8 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Powered by Gemini Live API
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Experience cutting-edge AI interaction with Google's most advanced
              real-time model. All conversations are processed in real-time with
              low latency and high accuracy.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Real-time processing
              </div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Low latency responses
              </div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Advanced AI understanding
              </div>
              <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                Multi-modal capabilities
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
