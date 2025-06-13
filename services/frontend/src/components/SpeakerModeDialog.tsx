"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface SpeakerModeDialogProps {
  onSelect: (isMultiSpeaker: boolean) => void;
  onClose: () => void;
}

export default function SpeakerModeDialog({ onSelect, onClose }: SpeakerModeDialogProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card rounded-3xl p-6 shadow-lg border border-border w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Select Speech Mode</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSelect(false)}
            className="p-4 border border-border rounded-2xl hover:bg-muted transition-colors"
          >
            <h3 className="font-medium mb-2">Single Speaker</h3>
            <p className="text-sm text-muted-foreground">
              Convert text using a single voice
            </p>
          </button>
          
          <button
            onClick={() => onSelect(true)}
            className="p-4 border border-border rounded-2xl hover:bg-muted transition-colors"
          >
            <h3 className="font-medium mb-2">Multi Speaker</h3>
            <p className="text-sm text-muted-foreground">
              Use different voices for dialogue
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}