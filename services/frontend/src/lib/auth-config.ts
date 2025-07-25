/**
 * Authentication configuration for the Genassist application
 * 
 * This configuration uses sessionStorage for security.
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
