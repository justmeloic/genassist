"use client"

import type React from "react"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"

interface LlmPromptProps {
  onSubmit: (prompt: string) => void
  isLoading: boolean
  disabled?: boolean
}

export default function LlmPrompt({ onSubmit, isLoading, disabled = false }: LlmPromptProps) {
  const [prompt, setPrompt] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim() && !isLoading && !disabled) {
      onSubmit(prompt.trim())
      setPrompt("")
    }
  }

  const suggestedPrompts = [
    "Fix all spelling and grammar mistakes",
    "Make the tone more professional",
    "Simplify the language for better readability",
    "Add more details and examples",
    "Make it more concise",
  ]

  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-lg hover:shadow-2xl focus-within:shadow-2xl transition-shadow duration-300 ease-in-out">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          AI Suggestions
        </h2>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how you'd like to improve the document..."
              className="w-full h-24 p-4 bg-background border border-input rounded-2xl resize-none disabled:bg-muted text-foreground placeholder:text-muted-foreground transition-all duration-300"
              disabled={isLoading || disabled}
            />
          </div>

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading || disabled}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Getting AI Suggestions...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Get AI Suggestions
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-3 font-medium">Quick suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setPrompt(suggestion)}
                disabled={isLoading || disabled}
                className="px-3 py-2 text-xs bg-secondary hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:text-purple-700 hover:border-purple-200 hover:shadow-md hover:scale-105 text-secondary-foreground rounded-full border border-border disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
