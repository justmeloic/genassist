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

"use client";

import VideoGenerator from "@/components/videogen/VideoGenerator";
import VideoPromptCard from "@/components/videogen/VideoPromptCard"; // Added import
import type { TextToVideoResponse } from "@/lib/api";
import { generateVideo } from "@/lib/api";
import { useState } from "react";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export default function VideoPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoResponse, setVideoResponse] =
    useState<TextToVideoResponse | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const suggestedPrompts = [
    "A serene mountain landscape with flowing waterfalls",
    "A modern city timelapse at sunset",
    "An artistic animation of space and galaxies",
    "A nature documentary style wildlife scene",
    "A professional product showcase animation",
  ];

  const generateVideoWithRetry = async (
    currentRetry: number = 0
  ): Promise<TextToVideoResponse> => {
    try {
      const response = await generateVideo({
        prompt: prompt.trim(),
        aspect_ratio: "16:9",
        person_generation: "allow_adult",
      });
      return response;
    } catch (error) {
      if (currentRetry < MAX_RETRIES - 1) {
        setIsRetrying(true);
        setRetryCount(currentRetry + 1);

        // Wait for RETRY_DELAY before trying again
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

        return generateVideoWithRetry(currentRetry + 1);
      }
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setShowGenerator(true);
    setGeneratingVideo(true);
    setError(null);
    setVideoResponse(null);
    setRetryCount(0);
    setIsRetrying(false);

    try {
      const response = await generateVideoWithRetry();
      setVideoResponse(response);
      setGeneratingVideo(false);
    } catch (error) {
      console.error("Error generating video:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred. Please try again.");
      }

      setShowGenerator(false);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const handleRetry = async () => {
    setError(null);
    setGeneratingVideo(true);
    setShowGenerator(true);

    try {
      const response = await generateVideoWithRetry();
      setVideoResponse(response);
      setGeneratingVideo(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred. Please try again.");
      }
      setShowGenerator(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center py-2">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
              VideoGen
            </span>
          </h1>
          <p className="text-muted-foreground mb-2 text-sm ">
            <span className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
              Generate videos from text descriptions using AI
            </span>
          </p>
        </div>

        <div
          className={`grid grid-cols-1 gap-8 ${
            showGenerator ? "lg:grid-cols-2" : "max-w-2xl mx-auto w-full"
          }`}
        >
          <div
            className={`transition-opacity duration-300 ${
              isLoading ? "opacity-40" : "opacity-100"
            }`}
          >
            <VideoPromptCard
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              suggestedPrompts={suggestedPrompts}
              onSuggestionClick={handleSuggestionClick}
            />
          </div>

          {/* Video Generator */}
          {showGenerator && (
            <div className="transition-all duration-700 ease-in-out opacity-100 translate-x-0">
              <VideoGenerator
                prompt={prompt}
                isGenerating={generatingVideo}
                isRetrying={isRetrying}
                retryCount={retryCount}
                maxRetries={MAX_RETRIES}
                error={error}
                videoResponse={videoResponse}
                onClose={() => setShowGenerator(false)}
                onRetry={handleRetry}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
