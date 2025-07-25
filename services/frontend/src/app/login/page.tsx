/**
 * Login page for Genassist application
 */

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api";
import { AUTH_CONFIG } from "@/lib/auth-config";
import { setSessionId } from "@/lib/session";
import { AlertCircle, Eye, EyeOff, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [secret, setSecret] = useState("");
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await login(secret, name, apiKey);

      // Store name in sessionStorage (not used for authentication)
      sessionStorage.setItem("user_name", name);

      // Store authentication in sessionStorage
      sessionStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.AUTHENTICATED, "true");
      sessionStorage.setItem(
        AUTH_CONFIG.STORAGE_KEYS.TIMESTAMP,
        Date.now().toString()
      );

      // Store session ID if provided
      if (response.session_id) {
        setSessionId(response.session_id);
      }

      // Redirect to the page they were trying to access or home
      const redirectTo =
        sessionStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.REDIRECT) || "/";
      sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.REDIRECT);

      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "Invalid access code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-white p-4">
      <Card className="w-full max-w-md bg-[#f0f4f8] dark:bg-[#f0f4f8] shadow-[0_10px_25px_0_rgba(0,0,0,0.2)] rounded-3xl border-none">
        <CardHeader className="text-center px-6 pt-8 pb-6">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white dark:bg-white rounded-full shadow-md animate-bounce">
              <Lock className="h-8 w-8 text-gray-600 dark:text-gray-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-900 mb-2">
            Genassist Access
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-600 text-sm">
            Enter your access code and Gemini API key to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name (optional)"
                className="w-full h-11 px-6 bg-white dark:bg-white rounded-xl focus:ring-4 focus:ring-blue-300/40 focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/40 focus-visible:ring-offset-0 transition-all duration-300 ease-out text-gray-900 dark:text-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-500"
                disabled={isLoading}
                autoComplete="name"
              />
              <div className="relative">
                <Input
                  id="secret"
                  type={showPassword ? "text" : "password"}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter your access code"
                  className="w-full h-11 px-6 pr-12 bg-white dark:bg-white rounded-xl focus:ring-4 focus:ring-blue-300/40 focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/40 focus-visible:ring-offset-0 transition-all duration-300 ease-out text-gray-900 dark:text-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-500"
                  required
                  disabled={isLoading}
                />
                {secret && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-700 focus:outline-none"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full h-11 px-6 pr-12 bg-white dark:bg-white rounded-xl focus:ring-4 focus:ring-blue-300/40 focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/40 focus-visible:ring-offset-0 transition-all duration-300 ease-out text-gray-900 dark:text-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-500"
                  required
                  disabled={isLoading}
                />
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-700 focus:outline-none"
                    disabled={isLoading}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </div>{" "}
            {error && (
              <Alert
                variant="destructive"
                className="bg-red-50 dark:bg-red-50 border-red-200 dark:border-red-200"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700 dark:text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex justify-center">
              <Button
                type="submit"
                className="px-8 h-11 bg-[#d3e2fd] dark:bg-[#d3e2fd] text-gray-800 dark:text-gray-800 hover:bg-[#d3e2fd]/90 dark:hover:bg-[#d3e2fd]/90 rounded-full font-medium transition-colors shadow-sm"
                disabled={isLoading || !secret.trim() || !apiKey.trim()}
              >
                {isLoading ? "Verifying..." : "Access Application"}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500 max-w-xs mx-auto">
              You need a valid Gemini API key to use this application.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 max-w-xs mx-auto">
              Get your API key from the Google AI Studio.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
