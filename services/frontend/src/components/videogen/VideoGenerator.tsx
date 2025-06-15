"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import type { TextToVideoResponse } from "@/lib/api";
import { getVideoUrl } from "@/lib/api";

interface VideoGeneratorProps {
  prompt: string;
  isGenerating: boolean;
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
  error: string | null;
  videoResponse: TextToVideoResponse | null;
  onClose: () => void;
  onRetry: () => void;
}

export default function VideoGenerator({
  prompt,
  isGenerating,
  isRetrying,
  retryCount,
  maxRetries,
  error,
  videoResponse,
  onClose,
  onRetry,
}: VideoGeneratorProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Set video URL when response changes
  useEffect(() => {
    if (videoResponse?.file_path) {
      setVideoUrl(getVideoUrl(videoResponse.file_path));
    }
  }, [videoResponse]);

  // Video event listeners
  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    const video = videoRef.current;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsVideoReady(true);
      setStatus("ready");
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [videoUrl]);

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = videoResponse?.file_path.split("/").pop() || "video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-card rounded-3xl dark:border dark:shadow-none border-border overflow-hidden shadow-card-normal hover:shadow-card-hover transition-shadow duration-300 ease-in-out">
      <div className="flex items-center justify-between p-6 border-border">
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
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse opacity-30" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-medium text-card-foreground">
                {isRetrying ? 'Retrying Generation' : 'Generating Video'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRetrying 
                  ? `Attempt ${retryCount} of ${maxRetries}...`
                  : 'Please wait while we process your request...'}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 max-w-sm text-center">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Creating video assets from your prompt
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                This may take a few minutes
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="text-red-500 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-center">
              <div className="font-medium mb-1">Error Generating Video</div>
              <div className="text-sm">{error}</div>
            </div>
            {retryCount < maxRetries && (
              <div className="flex justify-center">
                <button
                  onClick={onRetry}
                  className="px-8 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <video
              ref={videoRef}
              src={videoUrl || undefined}
              className="w-full aspect-video rounded-3xl bg-black"
              controls={isVideoReady}
              onCanPlayThrough={() => {
                setIsVideoReady(true);
                setStatus("ready");
              }}
              onLoadStart={() => {
                setIsVideoReady(false);
                setStatus("loading");
              }}
            />

            {status === "loading" && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-medium">Loading Video...</span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  Please wait while we prepare your video for playback.
                </p>
              </div>
            )}

            {isVideoReady && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100/50 dark:bg-transparent dark:border dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-500/50 hover:to-pink-500/50 hover:text-white text-blue-700/60 dark:text-gray-300 rounded-full transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
