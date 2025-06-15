"use client";

import type React from "react";
import { useState } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import Image from "next/image";

interface LlmPromptProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function LlmPrompt({
  onSubmit,
  isLoading,
  disabled = false,
}: LlmPromptProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading && !disabled) {
      onSubmit(prompt.trim());
      setPrompt("");
    }
  };

  const suggestedPrompts = [
    "Fix all spelling and grammar mistakes",
    "Make the tone more professional",
    "Simplify the language for better readability",
    "Add more details and examples",
    "Make it more concise",
  ];

  return (
    <div className="bg-card rounded-3xl dark:border dark:shadow-none border-border overflow-hidden shadow-card-normal hover:shadow-card-hover focus-within:shadow-card-hover transition-shadow duration-300 ease-in-out">
      <div className="p-6 border-border">
        <h2 className="text-xl opacity-65 text-card-foreground flex items-center gap-3">
          <Image
            src="/logo-avatar-icon.png"
            alt="Logo"
            width={25}
            height={25}
            className="object-contain"
          />
          AI Edit Suggestions
        </h2>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how you'd like to improve the document..."
              className="w-full h-24 p-4 pb-12 bg-background border border-input rounded-2xl resize-none outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] disabled:bg-muted text-sm text-foreground/65 placeholder:text-muted-foreground transition-all duration-300"
              disabled={isLoading || disabled}
            />
            {prompt.trim() && (
              <button
                type="submit"
                disabled={isLoading || disabled}
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

        <div className="mt-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestedPrompts.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setPrompt(suggestion)}
                disabled={isLoading || disabled}
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
