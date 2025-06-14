const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const DOCUMENT_EDIT_ENDPOINT = process.env.NEXT_PUBLIC_DOCUMENT_EDIT_ENDPOINT || '/v1/api/documentedit/';
const TEXT_TO_SPEECH_ENDPOINT = process.env.NEXT_PUBLIC_TEXT_TO_SPEECH_ENDPOINT || '/v1/api/text2speech/';
const TEXT_TO_VIDEO_ENDPOINT = process.env.NEXT_PUBLIC_TEXT_TO_VIDEO_ENDPOINT || '/v1/api/text2video/';

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

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Check if we have a rate limit error (429)
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a few minutes.');
    }
    
    // If we have an error message from the server, use it
    if (data?.message) {
      throw new Error(data.message);
    }
    
    // Otherwise use a generic error with the status code
    throw new Error(`Failed to generate video (${response.status})`);
  }

  if (!data) {
    throw new Error('Invalid response from server');
  }

  return data;
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