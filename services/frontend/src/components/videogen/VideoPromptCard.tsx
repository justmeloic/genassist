"use client";

import { Loader2, SendHorizontal, Video } from "lucide-react";
import React from "react";

interface VideoPromptCardProps {
  prompt: string;
  onPromptChange: (newPrompt: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
  suggestedPrompts: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export default function VideoPromptCard({
  prompt,
  onPromptChange,
  onSubmit,
  isLoading,
  error,
  suggestedPrompts,
  onSuggestionClick,
}: VideoPromptCardProps) {
  return (
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
        {/* Error Message */}
        {error && (
          <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
            <p>{error}</p>
          </div>
        )}

        {/* Form First */}
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
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
                onClick={() => onSuggestionClick(suggestion)}
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
  );
}
