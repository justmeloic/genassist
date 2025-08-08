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

import { ChatMode, getWebSocketUrl, SessionConfig, WebSocketMessageType } from '@/lib/api';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseGeminiWebSocketProps {
  chatMode: ChatMode;
  config: SessionConfig;
  onMessage?: (message: any) => void;
  onError?: (error: string) => void;
  onConnect?: (sessionId: string) => void;
  onDisconnect?: () => void;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  sessionId: string | null;
  error: string | null;
}

export function useGeminiWebSocket({
  chatMode,
  config,
  onMessage,
  onError,
  onConnect,
  onDisconnect
}: UseGeminiWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    sessionId: null,
    error: null,
  });

  const connect = useCallback(async () => {
    if (state.isConnected || state.isConnecting) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      const wsUrl = getWebSocketUrl(chatMode);
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
        
        if (message.type === WebSocketMessageType.SESSION_START) {
          setState(prev => ({ 
            ...prev, 
            isConnected: true, 
            isConnecting: false,
            sessionId: message.session_id 
          }));
          onConnect?.(message.session_id);
        }
        
        onMessage?.(message);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: false,
          sessionId: null 
        }));
        onDisconnect?.();
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        const errorMessage = "Connection failed. Please try again.";
        setState(prev => ({ 
          ...prev, 
          isConnecting: false,
          error: errorMessage
        }));
        onError?.(errorMessage);
      };

    } catch (error) {
      console.error("Failed to connect:", error);
      const errorMessage = "Failed to initialize connection.";
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        error: errorMessage
      }));
      onError?.(errorMessage);
    }
  }, [chatMode, config, onMessage, onError, onConnect, onDisconnect, state.isConnected, state.isConnecting]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const sendAudio = useCallback((audioData: string, mimeType: string = "audio/pcm") => {
    console.log('WebSocket sendAudio called with:', { 
      mimeType, 
      dataLength: audioData.length,
      sessionId: state.sessionId 
    });
    return sendMessage({
      type: WebSocketMessageType.AUDIO_DATA,
      session_id: state.sessionId,
      timestamp: Date.now(),
      data: {
        audio: audioData,
        mime_type: mimeType,
      },
    });
  }, [sendMessage, state.sessionId]);

  const sendText = useCallback((text: string) => {
    return sendMessage({
      type: WebSocketMessageType.TEXT_MESSAGE,
      session_id: state.sessionId,
      timestamp: Date.now(),
      data: {
        text: text,
      },
    });
  }, [sendMessage, state.sessionId]);

  const sendImage = useCallback((imageData: string, mimeType: string = "image/jpeg", type: "screen" | "camera" = "screen") => {
    const messageType = type === "screen" ? WebSocketMessageType.SCREEN_DATA : WebSocketMessageType.CAMERA_DATA;
    return sendMessage({
      type: messageType,
      session_id: state.sessionId,
      timestamp: Date.now(),
      data: {
        image: imageData,
        mime_type: mimeType,
      },
    });
  }, [sendMessage, state.sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendAudio,
    sendText,
    sendImage,
    sendMessage,
  };
}
