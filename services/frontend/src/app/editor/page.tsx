"use client";

import { useState, useEffect } from "react";
import { diffChars } from "diff";
import Editor from "@/components/docgen/Editor";
import DiffViewer from "@/components/docgen/DiffViewer";
import LlmPrompt from "@/components/docgen/LlmPrompt";
import AudioGenerator from "@/components/docgen/AudioGenerator";
import SpeakerModeDialog from "@/components/docgen/SpeakerModeDialog";
import { editDocument } from "@/lib/api";

const DEFAULT_CONTENT = `Welcome to the Document Editor!\n\nThis is a sample document that you can edit directly or improve using AI suggestions. Try typing in the editor below or use the AI prompt feature to get intelligent suggestions for your content.\n\nThe diff system will show you exactly what changes are being proposed before you accept them.`;

interface EditorState {
  originalContent: string;
  proposedContent: string;
  documentHistory: string[];
  diffResult: any[];
  showDiff: boolean;
  editMode: "direct" | "llm";
  isReading: boolean;
  showAudioGenerator: boolean;
  showSpeakerDialog: boolean;
  selectedIsMultiSpeaker: boolean;
  // Add audio state
  audioResponse: TextToSpeechResponse | null;
  audioStatus: "idle" | "generating" | "loading" | "ready";
}

export default function DocumentEditor() {
  // Initialize state with localStorage values or defaults
  const [originalContent, setOriginalContent] = useState<string>("");
  const [proposedContent, setProposedContent] = useState<string>("");
  const [documentHistory, setDocumentHistory] = useState<string[]>([]);
  const [diffResult, setDiffResult] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [showAudioGenerator, setShowAudioGenerator] = useState(false);
  const [showSpeakerDialog, setShowSpeakerDialog] = useState(false);
  const [selectedIsMultiSpeaker, setSelectedIsMultiSpeaker] = useState(false);
  const [editMode, setEditMode] = useState<"direct" | "llm">("direct");
  const [isReading, setIsReading] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] =
    useState<SpeechSynthesis | null>(null);

  // Add new state for audio persistence
  const [audioResponse, setAudioResponse] =
    useState<TextToSpeechResponse | null>(null);
  const [audioStatus, setAudioStatus] = useState<
    "idle" | "generating" | "loading" | "ready"
  >("idle");

  // Add error state
  const [error, setError] = useState<string | null>(null);

  // Load all saved state on component mount
  useEffect(() => {
    // Try to load the complete editor state
    const savedEditorState = localStorage.getItem("editor-state");

    if (savedEditorState) {
      try {
        const parsedState: EditorState = JSON.parse(savedEditorState);
        setOriginalContent(parsedState.originalContent || DEFAULT_CONTENT);
        setProposedContent(parsedState.proposedContent || "");
        setDocumentHistory(parsedState.documentHistory || [DEFAULT_CONTENT]);
        setDiffResult(parsedState.diffResult || []);
        setShowDiff(parsedState.showDiff || false);
        setEditMode(parsedState.editMode || "direct");
        setIsReading(parsedState.isReading || false);
        setShowAudioGenerator(parsedState.showAudioGenerator || false);
        setShowSpeakerDialog(parsedState.showSpeakerDialog || false);
        setSelectedIsMultiSpeaker(parsedState.selectedIsMultiSpeaker || false);
        setAudioResponse(parsedState.audioResponse || null);
        setAudioStatus(parsedState.audioStatus || "idle");
      } catch (error) {
        console.error("Error parsing saved editor state:", error);
        initializeDefaultState();
      }
    } else {
      initializeDefaultState();
    }

    // Initialize speech synthesis
    if (typeof window !== "undefined") {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  // Save state to localStorage whenever any relevant state changes
  useEffect(() => {
    // Only save if we have content to save
    if (originalContent || proposedContent) {
      const editorState: EditorState = {
        originalContent,
        proposedContent,
        documentHistory,
        diffResult,
        showDiff,
        editMode,
        isReading,
        showAudioGenerator,
        showSpeakerDialog,
        selectedIsMultiSpeaker,
        audioResponse,
        audioStatus,
      };
      localStorage.setItem("editor-state", JSON.stringify(editorState));
    }
  }, [
    originalContent,
    proposedContent,
    documentHistory,
    diffResult,
    showDiff,
    editMode,
    isReading,
    showAudioGenerator,
    showSpeakerDialog,
    selectedIsMultiSpeaker,
    audioResponse,
    audioStatus,
  ]);

  // Helper function to initialize default state
  const initializeDefaultState = () => {
    setOriginalContent(DEFAULT_CONTENT);
    setProposedContent("");
    setDocumentHistory([DEFAULT_CONTENT]);
    setDiffResult([]);
    setShowDiff(false);
    setEditMode("direct");

    // Save default state to localStorage
    const defaultState: EditorState = {
      originalContent: DEFAULT_CONTENT,
      proposedContent: "",
      documentHistory: [DEFAULT_CONTENT],
      diffResult: [],
      showDiff: false,
      editMode: "direct",
      isReading: false,
      showAudioGenerator: false,
      showSpeakerDialog: false,
      selectedIsMultiSpeaker: false,
      audioResponse: null,
      audioStatus: "idle",
    };
    localStorage.setItem("editor-state", JSON.stringify(defaultState));
  };

  const handleDirectEdit = (newContent: string) => {
    setProposedContent(newContent);
    // Immediately save to localStorage
    const currentState: EditorState = {
      originalContent,
      proposedContent: newContent,
      documentHistory,
      diffResult,
      showDiff,
      editMode,
      isReading,
      showAudioGenerator,
      showSpeakerDialog,
      selectedIsMultiSpeaker,
      audioResponse: null,
      audioStatus: "idle",
    };
    localStorage.setItem("editor-state", JSON.stringify(currentState));
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
    setError(null); // Clear any previous errors

    try {
      // Check for empty content
      if (!originalContent.trim()) {
        throw new Error(
          "Cannot generate suggestions for empty content. Please add some text first."
        );
      }

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
        throw new Error("Failed to generate AI suggestion. Please try again.");
      }
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptChanges = () => {
    const newContent = proposedContent;
    setOriginalContent(newContent);
    setDocumentHistory((prev) => [...prev, newContent]);
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

  // Clear persistence function (optional, for reset functionality)
  const clearEditorState = () => {
    localStorage.removeItem("editor-state");
    initializeDefaultState();
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center py-2">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
              DocGen
            </span>
          </h1>
          <p className="text-muted-foreground mb-2 text-sm ">
            <span className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
              Edit directly or use AI suggestions with visual diff approval
            </span>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
            <p>{error}</p>
          </div>
        )}

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
                  savedAudioResponse={audioResponse}
                  onAudioResponseChange={setAudioResponse}
                  savedStatus={audioStatus}
                  onStatusChange={setAudioStatus}
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
