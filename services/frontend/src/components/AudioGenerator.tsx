"use client";

import { useState, useEffect } from "react";
import { X, Download, Play, Pause, Headphones, Loader2 } from "lucide-react";

interface AudioGeneratorProps {
  content: string;
  onClose: () => void;
}

export default function AudioGenerator({
  content,
  onClose,
}: AudioGeneratorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Simulate audio generation
  useEffect(() => {
    const timer = setTimeout(() => {
      // For demo purposes, create a mock audio URL
      // In real implementation, this would be the actual generated audio file
      setAudioUrl("/placeholder-audio.mp3"); // This would be replaced with actual audio URL
      setIsLoading(false);
    }, 3000); // Simulate 3 seconds of processing

    return () => clearTimeout(timer);
  }, []);

  const handlePlayPause = () => {
    // In real implementation, this would control actual audio playback
    setIsPlaying(!isPlaying);

    // Simulate audio progress for demo
    if (!isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            clearInterval(interval);
            return 0;
          }
          return prev + 1;
        });
        setProgress((prev) => Math.min(prev + 1, 100));
      }, 100);
    }
  };

  const handleDownload = () => {
    // In real implementation, this would download the actual audio file
    const link = document.createElement("a");
    link.href = audioUrl || "#";
    link.download = `document-audio-${
      new Date().toISOString().split("T")[0]
    }.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-card rounded-3xl  border-border overflow-hidden shadow-card-normal hover:shadow-card-hover transition-shadow duration-300 ease-in-out">
      <div className="flex items-center justify-between p-6  border-border">
        <h2 className="text-xl opacity-65  text-card-foreground flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Headphones className="w-4 h-4 text-white" />
          </div>
          Audio Generator
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Close audio generator"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse opacity-30"></div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-card-foreground">
                Generating Audio
              </h3>
              <p className="text-sm text-muted-foreground">
                Converting your document to speech...
              </p>
              <div className="w-64 bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 max-w-sm">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Processing:</strong> {content.length} characters
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Estimated time: ~{Math.ceil(content.length / 100)} seconds
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">
                  Audio Generated Successfully!
                </span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                Your document has been converted to high-quality audio.
              </p>
            </div>

            {/* Audio Player */}
            <div className="bg-background border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePlayPause}
                    className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center text-white transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </button>
                  <div className="text-sm text-muted-foreground">
                    <div className="font-medium">Document Audio</div>
                    <div>
                      {formatTime(currentTime)} / {formatTime(100)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Audio Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="text-muted-foreground">Format</div>
                <div className="font-medium">MP3, 44.1kHz</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="text-muted-foreground">Size</div>
                <div className="font-medium">
                  ~{Math.ceil(content.length / 50)}KB
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
