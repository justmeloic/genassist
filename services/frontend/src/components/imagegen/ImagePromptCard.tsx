"use client";

import { Slider } from "@/components/ui/slider";
import { Image as ImageIcon, Loader2, SendHorizontal } from "lucide-react";
import React from "react";

interface ImagePromptCardProps {
  prompt: string;
  onPromptChange: (newPrompt: string) => void;
  numImages: number;
  onNumImagesChange: (value: number) => void;
  onSubmit: (event: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
  suggestedPrompts: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export default function ImagePromptCard({
  prompt,
  onPromptChange,
  numImages,
  onNumImagesChange,
  onSubmit,
  isLoading,
  error,
  suggestedPrompts,
  onSuggestionClick,
}: ImagePromptCardProps) {
  return (
    <div className="bg-card rounded-3xl dark:border dark:shadow-none border-border overflow-hidden shadow-card-normal hover:shadow-card-hover transition-shadow duration-300 ease-in-out">
      <div className="p-6 border-border">
        <h2 className="text-xl opacity-65 text-card-foreground flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          Image Prompt
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {error && !isLoading && (
          <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full h-32 p-4 pb-12 bg-background border border-input rounded-2xl resize-none outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] text-sm text-foreground/65 placeholder:text-muted-foreground transition-all duration-300"
              disabled={isLoading}
            />
            {prompt.trim() && (
              <button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className="absolute bottom-4 right-4 flex items-center justify-center w-7 h-7 bg-gradient-to-r from-blue-600/60 to-teal-600/60 hover:from-blue-700 hover:to-teal-700 text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SendHorizontal className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          <div className="space-y-4 flex flex-col items-center">
            <label className="text-sm font-medium bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent">
              Number of Images: {numImages}
            </label>
            <Slider
              defaultValue={[numImages]}
              min={1}
              max={4}
              step={1}
              onValueChange={(value) => onNumImagesChange(value[0])}
              disabled={isLoading}
              className="w-3/4 slider-gradient"
            />
            <div className="w-3/4 flex justify-between text-xs text-muted-foreground px-1">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={
                    n === numImages ? "font-bold text-teal-500" : "opacity-40"
                  }
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </form>

        <div className="pt-1  border-border">
          <div className="flex flex-wrap justify-center gap-2">
            {suggestedPrompts.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                disabled={isLoading}
                className="px-3 py-2 text-xs bg-secondary dark:bg-transparent dark:border dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-100 hover:to-teal-100 dark:hover:from-blue-600/20 dark:hover:to-teal-600/20 hover:text-blue-700 dark:hover:text-gray-200 hover:border-blue-200 dark:hover:border-gray-600 text-secondary-foreground dark:text-gray-400 rounded-full border border-border disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-105"
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
