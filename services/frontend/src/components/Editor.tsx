"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Eye, Undo, Save, Volume2, FileText, Headphones } from "lucide-react";
import DocumentViewer from "./DocumentViewer";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onPreviewChanges: () => void;
  onRevert: () => void;
  onSave: () => void;
  onReadAloud: () => void;
  onGenerateAudio: () => void;
  disabled?: boolean;
  showPreviewButton?: boolean;
  canRevert?: boolean;
  isReading?: boolean;
}

export default function Editor({
  content,
  onChange,
  onPreviewChanges,
  onRevert,
  onSave,
  onReadAloud,
  onGenerateAudio,
  disabled = false,
  showPreviewButton = false,
  canRevert = false,
  isReading = false,
}: EditorProps) {
  const [localContent, setLocalContent] = useState(content);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onChange(newContent);
  };

  return (
    <>
      <div className="bg-card rounded-3xl  border-border overflow-hidden shadow-card-normal hover:shadow-card-hover focus-within:shadow-card-hover transition-all duration-300">
        <div className="flex items-center justify-between p-6  border-border">
          <h2 className="text-xl  text-card-foreground opacity-65 ml-4">
            Direct Editor
          </h2>
          <div className="flex items-center gap-3">
            {showPreviewButton && (
              <button
                onClick={onPreviewChanges}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview Changes
              </button>
            )}
          </div>
        </div>
        <div className="p-6">
          <textarea
            value={localContent}
            onChange={handleChange}
            disabled={disabled}
            className="w-full h-96 p-4 bg-background  border-input rounded-2xl resize-none disabled:bg-muted disabled:cursor-not-allowed opacity-70 text-foreground placeholder:text-muted-foreground transition-all duration-300"
            placeholder="Start typing your document here... (Markdown supported)"
          />
          <div className="mt-3 space-y-3">
            <div className="text-sm text-muted-foreground ml-4 mb-6 opacity-65">
              {localContent.length} characters{" "}
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onRevert}
                disabled={!canRevert || disabled}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Revert to previous state"
              >
                <Undo className="w-4 h-4" />
                Revert
              </button>
              <button
                onClick={() => setIsViewerOpen(true)}
                disabled={disabled}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100/50 hover:bg-gradient-to-r hover:from-blue-500/50 hover:to-pink-500/50 hover:text-white text-blue-700/60 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="View document with Markdown formatting"
              >
                <FileText className="w-4 h-4" />
                View
              </button>

              <button
                onClick={onSave}
                disabled={disabled}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100/50 hover:bg-gradient-to-r hover:from-blue-500/50 hover:to-pink-500/50 hover:text-white text-blue-700/60 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save document locally"
              >
                <Save className="w-4 h-4" />
                Save
              </button>

              <button
                onClick={onReadAloud}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isReading
                    ? "bg-gradient-to-r from-blue-500/50 to-pink-500/50 text-white"
                    : "bg-blue-100/50 hover:bg-gradient-to-r hover:from-blue-500/50 hover:to-pink-500/50 hover:text-white text-blue-700/60"
                }`}
                title={isReading ? "Stop reading" : "Read document aloud"}
              >
                <Volume2 className="w-4 h-4" />
                {isReading ? "Stop" : "Read"}
              </button>

              <button
                onClick={onGenerateAudio}
                disabled={disabled}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100/50 hover:bg-gradient-to-r hover:from-blue-500/50 hover:to-pink-500/50 hover:text-white text-blue-700/60 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Generate audio file from document"
              >
                <Headphones className="w-4 h-4" />
                Audio
              </button>
            </div>
          </div>
        </div>
      </div>

      {isViewerOpen && (
        <DocumentViewer
          content={localContent}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </>
  );
}
