"use client";

import ImageGenerator from "@/components/imagegen/ImageGenerator";
import ImagePromptCard from "@/components/imagegen/ImagePromptCard";
import type { TextToImageResponse } from "@/lib/api";
import { generateImages } from "@/lib/api";
import { useState } from "react";

export default function ImagePage() {
  const [prompt, setPrompt] = useState("");
  const [numImages, setNumImages] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageResponse, setImageResponse] =
    useState<TextToImageResponse | null>(null);

  const suggestedPrompts = [
    "A photorealistic image of a cat wearing a tiny hat",
    "A vibrant illustration of a futuristic city",
    "An oil painting of a stormy sea",
    "A cute 3D render of a robot character",
    "A logo for a coffee shop called 'The Daily Grind'",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setShowGenerator(true);
    setIsGenerating(true);
    setError(null);
    setImageResponse(null);

    try {
      const response = await generateImages({
        prompt: prompt.trim(),
        num_images: numImages,
      });
      setImageResponse(response);
    } catch (error) {
      console.error("Error generating images:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    const event = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(event);
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
            <span className="bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent">
              Image Generation
            </span>
          </h1>
          <p className="text-muted-foreground mb-2 text-sm ">
            <span className="bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent">
              Generate high-quality images from text descriptions
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
            <ImagePromptCard
              prompt={prompt}
              onPromptChange={setPrompt}
              numImages={numImages}
              onNumImagesChange={setNumImages}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              suggestedPrompts={suggestedPrompts}
              onSuggestionClick={handleSuggestionClick}
            />
          </div>

          {/* Image Generator */}
          {showGenerator && (
            <div className="transition-all duration-700 ease-in-out opacity-100 translate-x-0">
              <ImageGenerator
                prompt={prompt}
                isGenerating={isGenerating}
                error={error}
                imageResponse={imageResponse}
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
