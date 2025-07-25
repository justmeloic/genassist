/**
 * Authentication hook for managing user login state
 */

"use client";

import { logout as apiLogout } from "@/lib/api";
import { AUTH_CONFIG } from "@/lib/auth-config";
import { clearSessionId } from "@/lib/session";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication status
  const checkAuth = useCallback(() => {
    try {
      const authenticated = sessionStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.AUTHENTICATED);
      const timestamp = sessionStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.TIMESTAMP);

      if (!authenticated || !timestamp) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return false;
      }

      // Check if session has expired
      const loginTime = parseInt(timestamp);
      const now = Date.now();
      const isExpired = now - loginTime > AUTH_CONFIG.SESSION_DURATION;

      if (isExpired) {
        // Clear expired session
        sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTHENTICATED);
        sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.TIMESTAMP);
        sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.SESSION_ID);
        setIsAuthenticated(false);
        setIsLoading(false);
        return false;
      }

      setIsAuthenticated(authenticated === "true");
      setIsLoading(false);
      return authenticated === "true";
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with local logout even if API fails
    }

    // Clear session storage
    sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTHENTICATED);
    sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.TIMESTAMP);
    sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.SESSION_ID);
    clearSessionId();
    
    setIsAuthenticated(false);
    router.push("/login");
  }, [router]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    isLoading,
    logout,
    checkAuth,
  };
}
