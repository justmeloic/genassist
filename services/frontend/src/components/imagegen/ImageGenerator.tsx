"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { TextToImageResponse } from "@/lib/api";
import { getImageUrl } from "@/lib/api";
import { Download, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ImageGeneratorProps {
  prompt: string;
  isGenerating: boolean;
  error: string | null;
  imageResponse: TextToImageResponse | null;
  onClose: () => void;
  onRetry: () => void;
}

export default function ImageGenerator({
  isGenerating,
  error,
  imageResponse,
  onClose,
  onRetry,
}: ImageGeneratorProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (imageResponse?.file_paths) {
      setImageUrls(imageResponse.file_paths.map(getImageUrl));
    }
  }, [imageResponse]);

  const handleDownload = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = url.split("/").pop() || "image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-card rounded-3xl dark:border dark:shadow-none  overflow-hidden shadow-card-normal hover:shadow-card-hover transition-shadow duration-300 ease-in-out">
      <div className="flex items-center justify-between p-6 ">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center animate-bounce">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-medium text-card-foreground">
                Generating Images
              </h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we process your request...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="text-red-500 p-4 rounded-4xl bg-red-50 dark:bg-red-900/20 text-center">
              <div className="font-medium mb-1">Error Generating Images</div>
              <div className="text-sm">{error}</div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={onRetry}
                className="px-8 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Carousel className="w-full">
              <CarouselContent>
                {imageUrls.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <Card className="border-none shadow-none">
                        <CardContent className="relative flex aspect-square items-center justify-center p-6">
                          <Image
                            src={url}
                            alt={`Generated image ${index + 1}`}
                            fill
                            className="object-contain rounded-3xl"
                          />
                          <button
                            onClick={() => handleDownload(url)}
                            className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/50 text-white rounded-full text-xs hover:bg-black/70 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-[-12px] top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute right-[-12px] top-1/2 -translate-y-1/2" />
            </Carousel>
          </div>
        )}
      </div>
    </div>
  );
}
