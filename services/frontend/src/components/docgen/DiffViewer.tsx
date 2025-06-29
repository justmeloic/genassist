"use client";
import { Edit, Sparkles } from "lucide-react";

interface DiffViewerProps {
  diffResult: Array<{
    added?: boolean;
    removed?: boolean;
    value: string;
  }>;
  onAccept: () => void;
  onReject: () => void;
  editMode: "direct" | "llm";
}

export default function DiffViewer({
  diffResult,
  onAccept,
  onReject,
  editMode,
}: DiffViewerProps) {
  const renderDiffText = () => {
    return diffResult.map((part, index) => {
      let className = "";
      let prefix = "";

      if (part.added) {
        className =
          "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300 border-l-4 border-green-500";
        prefix = "+ ";
      } else if (part.removed) {
        className =
          "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-l-4 border-red-500";
        prefix = "- ";
      } else {
        className = "bg-white dark:bg-gray-900/50 dark:text-gray-300";
        prefix = "  ";
      }

      return (
        <div key={index} className={`px-3 py-1 ${className}`}>
          <span className="font-mono text-sm whitespace-pre-wrap">
            {prefix}
            {part.value}
          </span>
        </div>
      );
    });
  };

  const hasChanges = diffResult.some((part) => part.added || part.removed);

  return (
    <div className="bg-card rounded-3xl dark:border dark:shadow border-border overflow-hidden shadow-card-normal hover:shadow-card-hover transition-shadow duration-300 ease-in-out">
      <div className="p-6 border-border">
        <h2 className="text-xl opacity-65 ml-4 text-card-foreground flex items-center gap-3">
          {editMode === "llm" ? (
            <>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              AI Suggested Changes
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Edit className="w-4 h-4 text-white" />
              </div>
              Direct Edit Changes
            </>
          )}
        </h2>
      </div>

      <div className="p-6">
        {hasChanges ? (
          <>
            <div className="mb-6 p-4 bg-blue-100/50 dark:bg-blue-950/20  rounded-2xl">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <div className="flex items-center gap-6 mb-3">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium">Removed</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Added</span>
                  </span>
                </div>
                <p className="text-blue-700 dark:text-blue-300">
                  Review the changes below and choose to accept or reject them.
                </p>
              </div>
            </div>

            <div className=" rounded-2xl max-h-96 overflow-y-auto scrollbar-hide">
              {renderDiffText()}
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={onAccept}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium transition-colors text-sm"
              >
                Accept
              </button>
              <button
                onClick={onReject}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white hover:bg-gray-50 text-red-600 border-2 border-red-200 rounded-full font-medium transition-colors text-sm"
              >
                Reject
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground shadow-md rounded-lg">
            <div className="text-5xl mb-4">🤔</div>
            <p className="text-lg font-medium">No changes detected</p>
            <p className="text-sm mt-2">The content appears to be identical</p>
          </div>
        )}
      </div>
    </div>
  );
}
