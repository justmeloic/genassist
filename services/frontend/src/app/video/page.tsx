"use client";

import { useState } from "react";
import { generateVideo } from "@/lib/api";
import type { TextToVideoResponse } from "@/lib/api";
import { Loader2, Video, Sparkles, SendHorizontal } from "lucide-react";
import VideoGenerator from "@/components/VideoGenerator";

export default function VideoPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);

  const suggestedPrompts = [
    "A serene mountain landscape with flowing waterfalls",
    "A modern city timelapse at sunset",
    "An artistic animation of space and galaxies",
    "A nature documentary style wildlife scene",
    "A professional product showcase animation",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setShowGenerator(true);
    setGeneratingVideo(true);

    try {
      const response = await generateVideo({
        prompt: prompt.trim(),
        aspect_ratio: "16:9",
        person_generation: "allow_adult",
      });
      setGeneratingVideo(false);
    } catch (error) {
      console.error("Error generating video:", error);
      alert("Failed to generate video. Please try again.");
      setShowGenerator(false);
    } finally {
      setIsLoading(false);
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
              Text to Video
            </span>
          </h1>
          <p className="text-muted-foreground mb-2 text-sm">
            Generate videos from text descriptions using AI
          </p>
        </div>

        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${
            !showGenerator ? "lg:grid-cols-1 max-w-2xl mx-auto" : ""
          }`}
        >
          {/* Prompt Input */}
          <div className="bg-card rounded-3xl dark:border dark:shadow-none border-border overflow-hidden shadow-card-normal hover:shadow-card-hover transition-shadow duration-300 ease-in-out">
            <div className="p-6 border-border">
              <h2 className="text-xl opacity-65 text-card-foreground flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Video className="w-4 h-4 text-white" />
                </div>
                Video Prompt
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Form First */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the video you want to generate..."
                    className="w-full h-32 p-4 pb-12 bg-background border border-input rounded-2xl resize-none outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] text-sm text-foreground/65 placeholder:text-muted-foreground transition-all duration-300"
                    disabled={isLoading}
                  />
                  {prompt.trim() && (
                    <button
                      type="submit"
                      disabled={!prompt.trim() || isLoading}
                      className="absolute bottom-4 right-4 flex items-center justify-center w-7 h-7 bg-gradient-to-r from-purple-600/60 to-pink-600/60 hover:from-purple-700 hover:to-pink-700 text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <SendHorizontal className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </form>

              {/* Suggestions Section Below */}
              <div className="pt-4  border-border">
                <div className="flex items-center justify-center gap-2 mb-3 text-sm text-muted-foreground"></div>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedPrompts.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={isLoading}
                      className="px-3 py-2 text-xs bg-secondary dark:bg-transparent dark:border dark:border-gray-700 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-600/20 dark:hover:to-pink-600/20 hover:text-purple-700 dark:hover:text-gray-200 hover:border-purple-200 dark:hover:border-gray-600 text-secondary-foreground dark:text-gray-400 rounded-full border border-border disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Video Generator */}
          {showGenerator && (
            <div className="transition-all duration-700 ease-in-out opacity-100 translate-x-0">
              <VideoGenerator
                prompt={prompt}
                isGenerating={generatingVideo}
                onClose={() => setShowGenerator(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
