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
import {
  ChatMode,
  getWebSocketUrl,
  SessionConfig,
  VoiceName,
  WebSocketMessageType,
} from "@/lib/api";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
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

interface ScreenShareState {
  isConnected: boolean;
  isRecording: boolean;
  isScreenSharing: boolean;
  isMuted: boolean;
  sessionId: string | null;
  chatHistory: ChatMessage[];
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  error: string | null;
}

export default function ScreenSharePage() {
  const [state, setState] = useState<ScreenShareState>({
    isConnected: false,
    isRecording: false,
    isScreenSharing: false,
    isMuted: false,
    sessionId: null,
    chatHistory: [],
    connectionStatus: "disconnected",
    error: null,
  });

  const [settings, setSettings] = useState({
    voiceName: VoiceName.PUCK,
    enableTranscription: true,
    systemInstruction:
      "You are a helpful AI assistant that can see the user's screen. Help them with what they're working on.",
  });

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const connectToChat = async () => {
    try {
      setState((prev) => ({
        ...prev,
        connectionStatus: "connecting",
        error: null,
      }));

      const config: SessionConfig = {
        chat_mode: ChatMode.SCREEN,
        voice_name: settings.voiceName,
        system_instruction: settings.systemInstruction,
        enable_input_transcription: settings.enableTranscription,
        enable_output_transcription: settings.enableTranscription,
      };

      const wsUrl = getWebSocketUrl(ChatMode.SCREEN);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        const connectMessage = {
          type: WebSocketMessageType.CONNECT,
          timestamp: Date.now(),
          data: config,
        };
        ws.send(JSON.stringify(connectMessage));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setState((prev) => ({
          ...prev,
          isConnected: false,
          connectionStatus: "disconnected",
          sessionId: null,
        }));
        stopScreenShare();
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setState((prev) => ({
          ...prev,
          connectionStatus: "error",
          error: "Connection failed. Please try again.",
        }));
      };
    } catch (error) {
      console.error("Failed to connect:", error);
      setState((prev) => ({
        ...prev,
        connectionStatus: "error",
        error: "Failed to initialize connection.",
      }));
    }
  };

  const disconnectFromChat = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopRecording();
    stopScreenShare();
    setState((prev) => ({
      ...prev,
      isConnected: false,
      connectionStatus: "disconnected",
      sessionId: null,
    }));
  };

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
    switch (message.type) {
      case WebSocketMessageType.SESSION_START:
        setState((prev) => ({
          ...prev,
          isConnected: true,
          connectionStatus: "connected",
          sessionId: message.session_id,
        }));
        break;
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
        playAudioResponse(message.data.audio);
        break;
      case WebSocketMessageType.ERROR:
        setState((prev) => ({
          ...prev,
          connectionStatus: "error",
          error: message.data.error,
        }));
        break;
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      screenStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Send screen captures periodically
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      const captureInterval = setInterval(() => {
        if (!state.isScreenSharing || !videoRef.current) {
          clearInterval(captureInterval);
          return;
        }

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (
              blob &&
              wsRef.current &&
              wsRef.current.readyState === WebSocket.OPEN
            ) {
              const reader = new FileReader();
              reader.onload = () => {
                const base64Image = (reader.result as string).split(",")[1];
                const screenMessage = {
                  type: WebSocketMessageType.SCREEN_DATA,
                  session_id: state.sessionId,
                  timestamp: Date.now(),
                  data: {
                    image: base64Image,
                    mime_type: "image/jpeg",
                  },
                };
                wsRef.current?.send(JSON.stringify(screenMessage));
              };
              reader.readAsDataURL(blob);
            }
          },
          "image/jpeg",
          0.8
        );
      }, 2000); // Send every 2 seconds

      setState((prev) => ({ ...prev, isScreenSharing: true }));

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error("Failed to start screen sharing:", error);
      setState((prev) => ({
        ...prev,
        error: "Screen sharing access denied or not available.",
      }));
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState((prev) => ({ ...prev, isScreenSharing: false }));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (
          event.data.size > 0 &&
          wsRef.current &&
          wsRef.current.readyState === WebSocket.OPEN
        ) {
          const arrayBuffer = await event.data.arrayBuffer();
          const base64Audio = btoa(
            String.fromCharCode(...new Uint8Array(arrayBuffer))
          );

          const audioMessage = {
            type: WebSocketMessageType.AUDIO_DATA,
            session_id: state.sessionId,
            timestamp: Date.now(),
            data: {
              audio: base64Audio,
              mime_type: "audio/webm",
            },
          };

          wsRef.current.send(JSON.stringify(audioMessage));
        }
      };

      mediaRecorder.start(1000);
      setState((prev) => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error("Failed to start recording:", error);
      setState((prev) => ({
        ...prev,
        error: "Microphone access denied or not available.",
      }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }
    setState((prev) => ({ ...prev, isRecording: false }));
  };

  const playAudioResponse = (base64Audio: string) => {
    try {
      const audioData = atob(base64Audio);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }

      const audioBlob = new Blob([audioArray], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      if (!state.isMuted) {
        audio.play();
      }

      audio.onended = () => URL.revokeObjectURL(audioUrl);
    } catch (error) {
      console.error("Failed to play audio:", error);
    }
  };

  const toggleMute = () => {
    setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleRecording = () => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const toggleScreenShare = () => {
    if (state.isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
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
              state.connectionStatus === "connected"
                ? "bg-green-500"
                : state.connectionStatus === "connecting"
                ? "bg-yellow-500"
                : state.connectionStatus === "error"
                ? "bg-red-500"
                : "bg-gray-500"
            }`}
          ></div>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">
            Screen Share Chat
          </h1>
        </div>

        <button
          onClick={() => {}}
          className="p-2 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        ></button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Screen Preview */}
        <div className="flex-1 bg-gray-900 relative rounded-3xl mx-14 mb-52">
          {state.isScreenSharing ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Monitor className="w-16 h-16 mx-auto mb-4 " />
                <p className="text-lg">No screen being shared</p>
                <p className="text-sm">Click "Share Screen" to start</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="w-80  border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Connection Status */}
          <div className="p-4">
            {state.connectionStatus === "disconnected" && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-4 text-center">
                <h3 className="font-medium mb-2">Ready to Start</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Connect to begin screen sharing with AI
                </p>
                <button
                  onClick={connectToChat}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
                >
                  <Phone className="w-4 h-4 inline mr-2" />
                  Connect
                </button>
              </div>
            )}

            {state.connectionStatus === "connecting" && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-3xl p-4 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Connecting...
                </p>
              </div>
            )}

            {state.connectionStatus === "error" && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-3xl p-4 text-center">
                <p className="text-red-700 dark:text-red-300 text-sm mb-2">
                  {state.error}
                </p>
                <button
                  onClick={connectToChat}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded-3xl hover:bg-red-700 transition-colors text-sm"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Chat Messages */}
          {state.isConnected && (
            <>
              {/* Controls */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={toggleScreenShare}
                    className={`p-2 rounded-3xl transition-all text-sm ${
                      state.isScreenSharing
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {state.isScreenSharing ? (
                      <MonitorOff className="w-4 h-4" />
                    ) : (
                      <Monitor className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={toggleMute}
                    className={`p-2 rounded-3xl transition-all ${
                      state.isMuted
                        ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {state.isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <button
                  onClick={toggleRecording}
                  className={`w-full p-3 rounded-3xl transition-all ${
                    state.isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  {state.isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={disconnectFromChat}
                  className="w-full mt-2 p-2 rounded-3xl bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition-all"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Transcript */}
              <ChatTranscript
                chatHistory={state.chatHistory}
                isConnected={state.isConnected}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
