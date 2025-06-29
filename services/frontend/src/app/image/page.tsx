"use client";

import ImageGenerator from "@/components/imagegen/ImageGenerator";
import { Slider } from "@/components/ui/slider";
import type { TextToImageResponse } from "@/lib/api";
import { generateImages } from "@/lib/api";
import { Image as ImageIcon, Loader2, SendHorizontal } from "lucide-react";
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
              {error && !isGenerating && (
                <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
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

                <div className="space-y-4">
                  <label className="text-sm font-medium bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent">
                    Number of Images: {numImages}
                  </label>
                  <Slider
                    defaultValue={[numImages]}
                    min={1}
                    max={4}
                    step={1}
                    onValueChange={(value) => setNumImages(value[0])}
                    disabled={isLoading}
                    className="slider-gradient-thumb"
                  />
                </div>
              </form>

              <div className="pt-4 border-t border-border">
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedPrompts.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
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
