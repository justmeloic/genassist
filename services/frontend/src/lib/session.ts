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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const AUTH_ENDPOINT = process.env.NEXT_PUBLIC_AUTH_ENDPOINT || '/v1/api/auth/';

/**
 * Get the user's Gemini API key from their session
 * This requires the session ID to be passed to the backend
 */
export async function getUserApiKey(): Promise<string> {
  const sessionId = sessionStorage.getItem('genassist_session_id');
  
  if (!sessionId) {
    throw new Error('No active session found');
  }

  const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINT}user-api-key`, {
    method: 'GET',
    headers: {
      'X-Session-ID': sessionId,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to retrieve API key from session');
  }

  const data = await response.json();
  return data.api_key;
}

/**
 * Store session ID after successful login
 */
export function setSessionId(sessionId: string): void {
  sessionStorage.setItem('genassist_session_id', sessionId);
}

/**
 * Get stored session ID
 */
export function getSessionId(): string | null {
  return sessionStorage.getItem('genassist_session_id');
}

/**
 * Clear session ID
 */
export function clearSessionId(): void {
  sessionStorage.removeItem('genassist_session_id');
}
