const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

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
  voice_name: string;
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

export async function editDocument(request: DocumentEditRequest): Promise<DocumentEditResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/api/documentedit/`, {
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
  const response = await fetch(`${API_BASE_URL}/v1/api/text2speech/`, {
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

export function getAudioUrl(fileId: string): string {
  return `${API_BASE_URL}/v1/api/text2speech/download/${fileId}`;
}