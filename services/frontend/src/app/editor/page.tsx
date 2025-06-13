"use client";

import { useState, useEffect } from "react";
import { diffChars } from "diff";
import Editor from "@/components/Editor";
import DiffViewer from "@/components/DiffViewer";
import LlmPrompt from "@/components/LlmPrompt";
import AudioGenerator from "@/components/AudioGenerator";
import SpeakerModeDialog from "@/components/SpeakerModeDialog";
import { editDocument } from "@/lib/api";

export default function DocumentEditor() {
  const [originalContent, setOriginalContent] = useState(
    "Welcome to the Document Editor!\n\nThis is a sample document that you can edit directly or improve using AI suggestions. Try typing in the editor below or use the AI prompt feature to get intelligent suggestions for your content.\n\nThe diff system will show you exactly what changes are being proposed before you accept them."
  );
  const [proposedContent, setProposedContent] = useState("");
  const [diffResult, setDiffResult] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [showAudioGenerator, setShowAudioGenerator] = useState(false);
  const [showSpeakerDialog, setShowSpeakerDialog] = useState(false);
  const [selectedIsMultiSpeaker, setSelectedIsMultiSpeaker] = useState(false);
  const [editMode, setEditMode] = useState<"direct" | "llm">("direct");
  const [documentHistory, setDocumentHistory] = useState<string[]>([
    originalContent,
  ]);
  const [isReading, setIsReading] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] =
    useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  const handleDirectEdit = (newContent: string) => {
    setProposedContent(newContent);
  };

  const handlePreviewChanges = () => {
    if (proposedContent && proposedContent !== originalContent) {
      // Close audio generator if it's open
      setShowAudioGenerator(false);

      // Show diff viewer
      const diff = diffChars(originalContent, proposedContent);
      setDiffResult(diff);
      setShowDiff(true);
      setEditMode("direct");
    }
  };

  const handleLlmSuggestion = async (prompt: string) => {
    setIsLoading(true);
    try {
      const response = await editDocument({
        content: originalContent,
        instructions: prompt,
        document_type: "general",
      });

      if (response.status === "success") {
        const aiSuggestion = response.edited_content;
        setProposedContent(aiSuggestion);
        const diff = diffChars(originalContent, aiSuggestion);
        setDiffResult(diff);
        setShowDiff(true);
        setEditMode("llm");
      } else {
        throw new Error("Failed to get AI suggestion");
      }
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      alert("Failed to get AI suggestion. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptChanges = () => {
    setOriginalContent(proposedContent);
    setDocumentHistory((prev) => [...prev, proposedContent]);
    setProposedContent("");
    setDiffResult([]);
    setShowDiff(false);
  };

  const handleRejectChanges = () => {
    setProposedContent("");
    setDiffResult([]);
    setShowDiff(false);
  };

  const handleRevert = () => {
    if (documentHistory.length > 1) {
      const newHistory = [...documentHistory];
      newHistory.pop(); // Remove current state
      const previousState = newHistory[newHistory.length - 1];

      setOriginalContent(previousState);
      setProposedContent("");
      setDocumentHistory(newHistory);
      setShowDiff(false);
    }
  };

  const handleSave = () => {
    const currentContent = proposedContent || originalContent;
    const blob = new Blob([currentContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `document-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReadAloud = () => {
    if (!speechSynthesis) return;

    if (isReading) {
      speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    const currentContent = proposedContent || originalContent;
    const utterance = new SpeechSynthesisUtterance(currentContent);

    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    // Set voice properties for better reading
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    speechSynthesis.speak(utterance);
  };

  const handleGenerateAudio = () => {
    setShowSpeakerDialog(true);
  };

  const handleSpeakerModeSelect = (isMultiSpeaker: boolean) => {
    setSelectedIsMultiSpeaker(isMultiSpeaker);
    setShowSpeakerDialog(false);
    setShowAudioGenerator(true);
  };

  const handleCloseAudioGenerator = () => {
    setShowAudioGenerator(false);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center py-2">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
              Editor
            </span>
          </h1>
          <p className="text-muted-foreground mb-2 text-sm ">
            <span className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
              Edit directly or use AI suggestions with visual diff approval
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Section */}
          <div className="space-y-6">
            <Editor
              content={
                showDiff ? originalContent : proposedContent || originalContent
              }
              onChange={handleDirectEdit}
              onPreviewChanges={handlePreviewChanges}
              onRevert={handleRevert}
              onSave={handleSave}
              onReadAloud={handleReadAloud}
              onGenerateAudio={handleGenerateAudio}
              disabled={isLoading || showDiff}
              showPreviewButton={
                proposedContent !== originalContent &&
                proposedContent !== "" &&
                !showDiff
              }
              canRevert={documentHistory.length > 1}
              isReading={isReading}
            />
          </div>

          {/* Right Panel - Diff Viewer, Audio Generator, or LlmPrompt */}
          <div className="relative">
            {/* Audio Generator */}
            <div
              className={`transition-all duration-700 ease-in-out ${
                showAudioGenerator
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4 pointer-events-none"
              }`}
            >
              {showAudioGenerator && (
                <AudioGenerator
                  content={proposedContent || originalContent}
                  isMultiSpeaker={selectedIsMultiSpeaker}
                  onClose={handleCloseAudioGenerator}
                />
              )}
            </div>

            {/* Diff Viewer */}
            <div
              className={`transition-all duration-700 ease-in-out ${
                showDiff && !showAudioGenerator
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4 pointer-events-none"
              }`}
            >
              {showDiff && !showAudioGenerator && (
                <DiffViewer
                  diffResult={diffResult}
                  onAccept={handleAcceptChanges}
                  onReject={handleRejectChanges}
                  editMode={editMode}
                />
              )}
            </div>

            {/* LlmPrompt */}
            {!showDiff && !showAudioGenerator && (
              <div
                className={`transition-all duration-700 ease-in-out opacity-100 translate-x-0`}
              >
                <LlmPrompt
                  onSubmit={handleLlmSuggestion}
                  isLoading={isLoading}
                  disabled={showDiff}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {showSpeakerDialog && (
        <SpeakerModeDialog
          onSelect={handleSpeakerModeSelect}
          onClose={() => setShowSpeakerDialog(false)}
        />
      )}
    </div>
  );
}
