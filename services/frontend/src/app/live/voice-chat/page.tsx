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
import { ChatTranscript } from "@/components/live/ChatTranscript";
import { useAudioManager } from "@/hooks/useAudioManager";
import { useGeminiWebSocket } from "@/hooks/useGeminiWebSocket";
import {
  ChatMode,
  SessionConfig,
  VoiceName,
  WebSocketMessageType,
} from "@/lib/api";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "bot";
  content: string;
  timestamp: number;
}

interface VoiceChatState {
  chatHistory: ChatMessage[];
  error: string | null;
}

export default function VoiceChatPage() {
  const [state, setState] = useState<VoiceChatState>({
    chatHistory: [],
    error: null,
  });
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState({
    voiceName: VoiceName.PUCK,
    enableTranscription: true,
    systemInstruction:
      "You are a helpful AI assistant. Keep responses conversational and engaging.",
  });

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const scrollHeight = chatContainerRef.current.scrollHeight;
      const height = chatContainerRef.current.clientHeight;
      const maxScrollTop = scrollHeight - height;
      chatContainerRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.chatHistory]);

  const handleWebSocketMessage = (message: any) => {
    console.log("Received WebSocket message:", message.type, message.data);

    switch (message.type) {
      case WebSocketMessageType.INPUT_TRANSCRIPTION:
        setState((prev) => ({
          ...prev,
          chatHistory: [
            ...prev.chatHistory,
            {
              role: "user",
              content: message.data.text,
              timestamp: Date.now(),
            },
          ],
        }));
        break;
      case WebSocketMessageType.OUTPUT_TRANSCRIPTION:
        setState((prev) => ({
          ...prev,
          chatHistory: [
            ...prev.chatHistory,
            {
              role: "bot",
              content: message.data.text,
              timestamp: Date.now(),
            },
          ],
        }));
        break;
      case WebSocketMessageType.AUDIO_DATA:
        console.log(
          "Received audio data, muted:",
          isMuted,
          "audio length:",
          message.data.audio?.length
        );
        if (!isMuted && message.data.audio) {
          playAudio(message.data.audio, "audio/pcm").catch((err) =>
            console.error("Failed to play audio:", err)
          );
        }
        break;
      case WebSocketMessageType.ERROR:
        setState((prev) => ({
          ...prev,
          error: message.data.error,
        }));
        break;
    }
  };

  const config: SessionConfig = {
    chat_mode: ChatMode.VOICE,
    voice_name: settings.voiceName,
    system_instruction: settings.systemInstruction,
    enable_input_transcription: settings.enableTranscription,
    enable_output_transcription: settings.enableTranscription,
  };

  const {
    isConnected,
    isConnecting,
    sessionId,
    connect,
    disconnect,
    sendAudio,
    error: wsError,
  } = useGeminiWebSocket({
    chatMode: ChatMode.VOICE,
    config,
    onMessage: handleWebSocketMessage,
    onError: (error) => setState((prev) => ({ ...prev, error })),
  });

  const {
    isRecording,
    isMuted,
    hasPermission,
    startRecording,
    stopRecording,
    toggleRecording,
    playAudio,
    toggleMute,
    requestPermission,
    stopAudioPlayback,
    error: audioError,
  } = useAudioManager({
    onAudioData: (audioData, mimeType) => {
      console.log("Audio data captured:", {
        mimeType,
        dataLength: audioData.length,
        isConnected,
        sessionId,
      });
      if (isConnected && sessionId) {
        console.log("Sending audio with MIME type:", mimeType);
        sendAudio(audioData, mimeType);
      }
    },
    chunkInterval: 1000,
  });

  const connectToChat = async () => {
    if (!hasPermission) {
      await requestPermission();
    }
    await connect();
  };

  const disconnectFromChat = () => {
    disconnect();
    if (isRecording) {
      stopRecording();
    }
    stopAudioPlayback();
  };

  const currentError = state.error || wsError || audioError;

  const toggleMuteAudio = () => {
    toggleMute();
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4  border-gray-200 dark:border-gray-700">
        <Link
          href="/live"
          className="p-3 bg-blue-100 dark:bg-gray-700 rounded-full hover:bg-blue-200 dark:hover:bg-gray-600 transition-all duration-300 shadow-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>

        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full ${
              isConnected
                ? "bg-green-500"
                : isConnecting
                ? "bg-yellow-500"
                : currentError
                ? "bg-red-500"
                : "bg-gray-500"
            }`}
          ></div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
            Voice Chat
          </h1>
        </div>

        <button
          onClick={() => {
            /* TODO: Open settings modal */
          }}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        ></button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Connection Status */}
        <div className="p-4 text-center">
          {!isConnected && !isConnecting && !currentError && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-6 max-w-[900px] mx-auto">
              <h3 className="text-lg font-medium mb-2">
                Ready to Start Voice Chat
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Click connect to begin your conversation with the AI assistant
              </p>
              <button
                onClick={connectToChat}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all hover:scale-105"
              >
                <Phone className="w-4 h-4 inline mr-2" />
                Connect to Chat
              </button>
            </div>
          )}

          {isConnecting && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-3xl p-6 max-w-[900px] mx-auto mb-4">
              <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-yellow-700 dark:text-yellow-300">
                Connecting to AI assistant...
              </p>
            </div>
          )}

          {currentError && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-3xl p-6 max-w-[900px] mx-auto ">
              <p className="text-red-700 dark:text-red-300 mb-3">
                {currentError}
              </p>
              <button
                onClick={connectToChat}
                className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                Retry connection
              </button>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        {isConnected && (
          <>
            {/* Controls */}
            <div className="p-6  border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={toggleMuteAudio}
                  className={`p-3 rounded-full transition-all ${
                    isMuted
                      ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {isMuted ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </button>

                <button
                  onClick={toggleRecording}
                  className={`p-4 rounded-full transition-all ${
                    isRecording
                      ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>

                <button
                  onClick={disconnectFromChat}
                  className="p-3 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition-all"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isRecording
                    ? "Recording... Speak now"
                    : "Click microphone to speak"}
                </p>
              </div>
            </div>

            {/* Chat Transcript */}
            <ChatTranscript
              chatHistory={state.chatHistory}
              isConnected={isConnected}
            />
          </>
        )}
      </div>
    </div>
  );
}
