const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const DOCUMENT_EDIT_ENDPOINT = process.env.NEXT_PUBLIC_DOCUMENT_EDIT_ENDPOINT || '/v1/api/documentedit/';
const TEXT_TO_SPEECH_ENDPOINT = process.env.NEXT_PUBLIC_TEXT_TO_SPEECH_ENDPOINT || '/v1/api/text2speech/';
const TEXT_TO_VIDEO_ENDPOINT = process.env.NEXT_PUBLIC_TEXT_TO_VIDEO_ENDPOINT || '/v1/api/text2video/';
const TEXT_TO_IMAGE_ENDPOINT = process.env.NEXT_PUBLIC_TEXT_TO_IMAGE_ENDPOINT || '/v1/api/text2image/';
const GEMINI_LIVE_ENDPOINT = process.env.NEXT_PUBLIC_GEMINI_LIVE_ENDPOINT || '/v1/api/gemini-live/';
const AUTH_ENDPOINT = process.env.NEXT_PUBLIC_AUTH_ENDPOINT || '/v1/api/auth/';

// WebSocket endpoints
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8000';

interface DocumentEditRequest {
  content: string;
  instructions: string;
  document_type: string;
}

interface DocumentEditResponse {
  edited_content: string;
  original_length: number;
  edited_length: number;
  status: string;
}

export interface TextToSpeechRequest {
  text: string;
  is_multi_speaker: boolean;
  voice_name?: string;
  speed: "slow" | "normal" | "fast";
  pitch: "low" | "normal" | "high";
}

interface TextToSpeechResponse {
  audio_file_id: string;
  filename: string;
  file_path: string;
  duration_seconds: number;
  file_size_bytes: number;
  status: string;
}

export interface TextToVideoRequest {
  prompt: string;
  aspect_ratio: "16:9" | "9:16";
  person_generation: "allow_adult" | "dont_allow";
}

export interface TextToVideoResponse {
  file_path: string;
  status: string;
}

export interface TextToImageRequest {
  prompt: string;
  num_images: number;
}

export interface TextToImageResponse {
  file_paths: string[];
  status: string;
}

export async function editDocument(request: DocumentEditRequest): Promise<DocumentEditResponse> {
  const response = await fetch(`${API_BASE_URL}${DOCUMENT_EDIT_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to edit document');
  }

  return response.json();
}

export async function generateSpeech(request: TextToSpeechRequest): Promise<TextToSpeechResponse> {
  const response = await fetch(`${API_BASE_URL}${TEXT_TO_SPEECH_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to generate speech');
  }

  return response.json();
}

export async function generateVideo(request: TextToVideoRequest): Promise<TextToVideoResponse> {
  const response = await fetch(`${API_BASE_URL}${TEXT_TO_VIDEO_ENDPOINT}generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  // Handle error responses (any status code that is not 2xx)
  if (!response.ok) {
    // Try to parse the error response body to get the `detail` message
    const errorData = await response.json().catch(() => null);

    // If the backend sent a `detail` field (FastAPI default), use it as the error message.
    if (errorData?.detail) {
      throw new Error(errorData.detail);
    }
    
    // As a fallback, use the HTTP status text.
    throw new Error(`Request failed with status: ${response.status} ${response.statusText}`);
  }

  // If the response was successful, parse the JSON body
  const successData = await response.json();
  if (!successData) {
    throw new Error('Invalid response from server');
  }

  return successData;
}

export async function generateImages(request: TextToImageRequest): Promise<TextToImageResponse> {
  const response = await fetch(`${API_BASE_URL}${TEXT_TO_IMAGE_ENDPOINT}generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData?.detail) {
      throw new Error(errorData.detail);
    }
    throw new Error(`Request failed with status: ${response.status} ${response.statusText}`);
  }

  const successData = await response.json();
  if (!successData) {
    throw new Error('Invalid response from server');
  }

  return successData;
}

export function getAudioUrl(fileId: string): string {
  return `${API_BASE_URL}${TEXT_TO_SPEECH_ENDPOINT}download/${fileId}`;
}

export function getVideoUrl(filePath: string | undefined): string {
  if (!filePath) {
    throw new Error('File path is required');
  }
  
  const filename = filePath.split('/').pop();
  if (!filename) {
    throw new Error('Invalid file path');
  }
  
  return `${API_BASE_URL}${TEXT_TO_VIDEO_ENDPOINT}download/${filename}`;
}

export function getImageUrl(filePath: string | undefined): string {
  if (!filePath) {
    throw new Error('File path is required');
  }
  const filename = filePath.split('/').pop();
  if (!filename) {
    throw new Error('Invalid file path');
  }
  // Ensure no double slash in the URL
  return `${API_BASE_URL}${TEXT_TO_IMAGE_ENDPOINT}/download/${filename}`.replace(/([^:]\/)\/+/g, "$1");
}

// Gemini Live WebSocket Types
export enum ChatMode {
  VOICE = "voice",
  SCREEN = "screen", 
  CAMERA = "camera"
}

export enum VoiceName {
  PUCK = "Puck",
  CHARON = "Charon", 
  KORE = "Kore",
  FENRIR = "Fenrir",
  AOEDE = "Aoede"
}

export enum WebSocketMessageType {
  // Connection management
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  ERROR = "error",
  
  // Audio messages
  AUDIO_DATA = "audio_data",
  AUDIO_CONFIG = "audio_config",
  
  // Text messages
  TEXT_MESSAGE = "text_message",
  TEXT_RESPONSE = "text_response",
  
  // Screen/Camera messages
  SCREEN_DATA = "screen_data",
  CAMERA_DATA = "camera_data",
  
  // Transcription messages
  INPUT_TRANSCRIPTION = "input_transcription",
  OUTPUT_TRANSCRIPTION = "output_transcription",
  
  // Session management
  SESSION_START = "session_start",
  SESSION_END = "session_end",
  SESSION_CONFIG = "session_config"
}

export interface SessionConfig {
  chat_mode: ChatMode;
  voice_name?: VoiceName;
  system_instruction?: string;
  enable_input_transcription?: boolean;
  enable_output_transcription?: boolean;
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  session_id?: string;
  timestamp?: number;
  data?: any;
}

export interface ConnectMessage extends WebSocketMessage {
  type: WebSocketMessageType.CONNECT;
  data: SessionConfig;
}

export interface AudioMessage extends WebSocketMessage {
  type: WebSocketMessageType.AUDIO_DATA;
  data: {
    audio: string; // base64 encoded
    mime_type?: string;
  };
}

export interface TextMessage extends WebSocketMessage {
  type: WebSocketMessageType.TEXT_MESSAGE;
  data: {
    text: string;
  };
}

export interface ScreenMessage extends WebSocketMessage {
  type: WebSocketMessageType.SCREEN_DATA;
  data: {
    image: string; // base64 encoded
    mime_type?: string;
  };
}

export interface CameraMessage extends WebSocketMessage {
  type: WebSocketMessageType.CAMERA_DATA;
  data: {
    image: string; // base64 encoded
    mime_type?: string;
  };
}

export interface SessionInfo {
  session_id: string;
  chat_mode: ChatMode;
  voice_name?: VoiceName;
  connected_at: number;
  last_activity: number;
  is_active: boolean;
}

export interface SessionStatsResponse {
  total_sessions: number;
  active_sessions: number;
  voice_sessions: number;
  screen_sessions: number;
  camera_sessions: number;
  average_session_duration: number;
}

// Gemini Live WebSocket Functions
export function getWebSocketUrl(chatMode: ChatMode): string {
  const endpoint = chatMode === ChatMode.VOICE ? 'voice-chat' : 
                   chatMode === ChatMode.SCREEN ? 'screen-share' : 'camera-chat';
  return `${WS_BASE_URL}${GEMINI_LIVE_ENDPOINT}${endpoint}`;
}

export async function getAvailableVoices(): Promise<{voices: Array<{id: string, name: string, description: string}>}> {
  const response = await fetch(`${API_BASE_URL}${GEMINI_LIVE_ENDPOINT}voices`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch available voices');
  }
  
  return response.json();
}

export async function getSessionStats(): Promise<SessionStatsResponse> {
  const response = await fetch(`${API_BASE_URL}${GEMINI_LIVE_ENDPOINT}stats`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch session stats');
  }
  
  return response.json();
}

export async function getActiveSessions(): Promise<{sessions: SessionInfo[], total_count: number}> {
  const response = await fetch(`${API_BASE_URL}${GEMINI_LIVE_ENDPOINT}sessions`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch active sessions');
  }
  
  return response.json();
}

export async function terminateSession(sessionId: string): Promise<{message: string, session_id: string}> {
  const response = await fetch(`${API_BASE_URL}${GEMINI_LIVE_ENDPOINT}sessions/${sessionId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to terminate session');
  }
  
  return response.json();
}

export async function healthCheck(): Promise<{status: string, active_sessions: number, total_sessions: number}> {
  const response = await fetch(`${API_BASE_URL}${GEMINI_LIVE_ENDPOINT}health`);
  
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  
  return response.json();
}

// Authentication functions
export const login = async (secret: string, name: string, geminiApiKey: string) => {
  const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINT}login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ secret, name, gemini_api_key: geminiApiKey }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Login failed');
  }

  return response.json();
};

export const logout = async () => {
  const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINT}logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Logout failed');
  }

  return response.json();
};