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

export const AUTH_CONFIG = {
  // Session duration in milliseconds (24 hours)
  SESSION_DURATION: 24 * 60 * 60 * 1000,
  
  // Session storage keys
  STORAGE_KEYS: {
    AUTHENTICATED: "genassist_authenticated",
    TIMESTAMP: "genassist_auth_timestamp",
    REDIRECT: "genassist_redirect_after_login",
    SESSION_ID: "genassist_session_id",
  },
} as const;

export type AuthConfig = typeof AUTH_CONFIG;
