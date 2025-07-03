"use client";
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
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface VoiceChatState {
  transcript: string;
  aiResponse: string;
  error: string | null;
}

export default function VoiceChatPage() {
  const [state, setState] = useState<VoiceChatState>({
    transcript: "",
    aiResponse: "",
    error: null,
  });

  const [settings, setSettings] = useState({
    voiceName: VoiceName.PUCK,
    enableTranscription: true,
    systemInstruction:
      "You are a helpful AI assistant. Keep responses conversational and engaging.",
  });

  const handleWebSocketMessage = (message: any) => {
    console.log("Received WebSocket message:", message.type, message.data);

    switch (message.type) {
      case WebSocketMessageType.INPUT_TRANSCRIPTION:
        setState((prev) => ({ ...prev, transcript: message.data.text }));
        break;
      case WebSocketMessageType.OUTPUT_TRANSCRIPTION:
        setState((prev) => ({ ...prev, aiResponse: message.data.text }));
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
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <Link
          href="/live"
          className="p-3 bg-blue-100 dark:bg-gray-700 rounded-full hover:bg-blue-200 dark:hover:bg-gray-600 transition-all duration-300 shadow-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>

        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected
                ? "bg-green-500"
                : isConnecting
                ? "bg-yellow-500"
                : currentError
                ? "bg-red-500"
                : "bg-gray-500"
            }`}
          ></div>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Voice Chat
          </h1>
        </div>

        <button
          onClick={() => {
            /* TODO: Open settings modal */
          }}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Connection Status */}
        <div className="p-4 text-center">
          {!isConnected && !isConnecting && !currentError && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-2">
                Ready to Start Voice Chat
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Click connect to begin your conversation with the AI assistant
              </p>
              <button
                onClick={connectToChat}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transition-all hover:scale-105"
              >
                <Phone className="w-4 h-4 inline mr-2" />
                Connect to Chat
              </button>
            </div>
          )}

          {isConnecting && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
              <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-yellow-700 dark:text-yellow-300">
                Connecting to AI assistant...
              </p>
            </div>
          )}

          {currentError && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
              <p className="text-red-700 dark:text-red-300 mb-3">
                {currentError}
              </p>
              <button
                onClick={connectToChat}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        {isConnected && (
          <>
            {/* Transcription Area */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {state.transcript && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    You said:
                  </h4>
                  <p className="text-blue-800 dark:text-blue-200">
                    {state.transcript}
                  </p>
                </div>
              )}

              {state.aiResponse && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                    AI Response:
                  </h4>
                  <p className="text-purple-800 dark:text-purple-200">
                    {state.aiResponse}
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
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
          </>
        )}
      </div>
    </div>
  );
}
