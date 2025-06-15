"use client";

import type React from "react";

import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { Form as UIForm } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  ImageIcon,
  SlidersHorizontal,
  ArrowUp,
  Loader2,
  SendHorizontal,
} from "lucide-react";
import AutoResizeTextarea from "./auto-resize-textarea";
import ImageUploadArea from "./image-upload-area";
import { formSchema } from "@/lib/form-schema";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface FormProps {
  isLoading: boolean;
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
  onOpenOptions: () => void;
}

export default function Form({
  isLoading,
  onSubmit,
  onOpenOptions,
}: FormProps) {
  // Update suggested prompts
  const suggestedPrompts = [
    "A realistic robot character",
    "A luxury car",
    "A human face",
    "A detailed tree with leaves",
  ];

  // Update to only set value without submitting
  const handleSuggestionClick = (e: React.MouseEvent, suggestion: string) => {
    e.preventDefault(); // Prevent form submission
    form.setValue("prompt", suggestion);
    // Focus the textarea after setting value
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.focus();
      // Move cursor to end of text
      const len = suggestion.length;
      textarea.setSelectionRange(len, len);
    }
  };

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const dragCounter = useRef(0);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      images: [],
      condition_mode: "concat",
      quality: "medium",
      geometry_file_format: "glb",
      use_hyper: false,
      tier: "Regular",
      TAPose: false,
      material: "PBR",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

  const addImages = (files: File[]) => {
    if (files.length === 0) return;

    // Limit to 5 images total
    const currentImages = form.getValues("images") || [];
    const totalImages = currentImages.length + files.length;

    if (totalImages > 5) {
      setError("You can upload a maximum of 5 images");
      const allowedNewImages = 5 - currentImages.length;
      files = files.slice(0, allowedNewImages);

      if (files.length === 0) return;
    }

    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    const updatedImages = [...currentImages, ...files];

    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    form.setValue("images", updatedImages);
  };

  const removeImage = (index: number) => {
    const currentImages = form.getValues("images") || [];
    const newImages = [...currentImages];
    newImages.splice(index, 1);

    const newPreviewUrls = [...previewUrls];
    URL.revokeObjectURL(newPreviewUrls[index]);
    newPreviewUrls.splice(index, 1);

    setPreviewUrls(newPreviewUrls);
    form.setValue("images", newImages);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      addImages(files);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On desktop, Enter submits the form unless Shift is pressed
    // On mobile, Enter creates a new line
    if (e.key === "Enter") {
      if (!isMobile && !e.shiftKey) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
  };

  return (
    <UIForm {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="relative"
      >
        <div
          ref={dropAreaRef}
          className={cn(
            "bg-white dark:bg-card rounded-3xl dark:border dark:shadow-none border-border overflow-hidden shadow-card-normal hover:shadow-card-hover focus-within:shadow-card-hover transition-shadow duration-300 ease-in-out",
            isDragging
              ? "ring-2 ring-white"
              : isFocused
              ? "ring-2 ring-white"
              : "",
            isLoading && "animate-pulse-loading pointer-events-none opacity-70"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Image previews */}
          <ImageUploadArea
            previewUrls={previewUrls}
            onRemoveImage={removeImage}
            isLoading={isLoading}
          />

          <div className="px-2 py-1.5">
            <div className="flex items-center">
              <div className="flex space-x-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={triggerFileInput}
                  className="text-gray-400 hover:text-white hover:bg-transparent rounded-full h-10 w-10 ml-0"
                  disabled={isLoading}
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onOpenOptions}
                  className="text-gray-400 hover:text-white hover:bg-transparent rounded-full h-10 w-10 ml-0"
                  disabled={isLoading}
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </Button>
              </div>

              <AutoResizeTextarea
                placeholder="Generate 3D model..."
                className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-500 dark:text-white placeholder:text-gray-400 py-2 px-3 resize-none text-base tracking-normal"
                {...form.register("prompt")}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />

              {/* Only show submit button when there's text */}
              {form.watch("prompt") && (
                <div>
                  <Button
                    type="submit"
                    className="opacity-40 hover:opacity-95 bg-gradient-to-r from-blue-500/50 to-pink-500/80 hover:from-blue-500/50 hover:to-pink-500/80 text-white rounded-full h-10 w-10 p-0 flex items-center justify-center transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <SendHorizontal className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Update suggestions styling */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestedPrompts.map((suggestion, index) => (
              <button
                key={index}
                onClick={(e) => handleSuggestionClick(e, suggestion)}
                type="button" // Add this to prevent form submission
                disabled={isLoading}
                className="px-3 py-2 text-xs bg-secondary dark:bg-transparent dark:border dark:border-gray-700 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-600/20 dark:hover:to-pink-600/20 hover:text-purple-700 dark:hover:text-gray-200 hover:border-purple-200 dark:hover:border-gray-600 text-secondary-foreground dark:text-gray-400 rounded-full border border-border disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-2 text-red-400 text-sm tracking-normal">
            {error}
          </div>
        )}
      </form>
    </UIForm>
  );
}
