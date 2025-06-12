"use client";

import { useState, useEffect, useRef } from "react";
import type { TextToSpeechResponse } from "@/lib/api";
import { X, Download, Play, Pause, Headphones, Loader2 } from "lucide-react";
import { generateSpeech, getAudioUrl } from "@/lib/api";

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
  const [audioResponse, setAudioResponse] =
    useState<TextToSpeechResponse | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate audio when component mounts
  useEffect(() => {
    const generateAudio = async () => {
      try {
        const response = await generateSpeech({
          text: content,
          voice_name: "Kore",
          speed: "normal",
          pitch: "normal",
        });

        setAudioResponse(response);
        setAudioUrl(getAudioUrl(response.audio_file_id));
        setDuration(response.duration_seconds);
        setIsLoading(false);
      } catch (error) {
        console.error("Error generating audio:", error);
        alert("Failed to generate audio. Please try again.");
        setIsLoading(false);
      }
    };

    generateAudio();
  }, [content]);

  // Update handlePlayPause to use actual audio element
  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Add audio event listeners
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    const audio = audioRef.current;

    const updateProgress = () => {
      if (!audio) return;
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [audioUrl]);

  const handleDownload = () => {
    if (audioResponse) {
      const link = document.createElement("a");
      link.href = getAudioUrl(audioResponse.audio_file_id);
      link.download = audioResponse.filename;
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

            {/* Add hidden audio element */}
            <audio ref={audioRef} src={audioUrl || undefined} />

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
                      {formatTime(currentTime)} / {formatTime(duration)}
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
                <div className="font-medium">WAV Audio</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="text-muted-foreground">Size</div>
                <div className="font-medium">
                  {audioResponse
                    ? `${Math.round(audioResponse.file_size_bytes / 1024)}KB`
                    : "..."}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
