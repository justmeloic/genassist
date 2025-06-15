"use client";

import { Box, Loader2, SendHorizontal } from "lucide-react";

export default function ModelViewer() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full">
        <div className="bg-card rounded-3xl dark:border dark:shadow-none border-border overflow-hidden shadow-card-normal hover:shadow-card-hover transition-shadow duration-300 ease-in-out">
          <div className="p-6 border-border">
            <h2 className="text-xl opacity-65 text-card-foreground flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Box className="w-4 h-4 text-white" />
              </div>
              3D Model Generator
            </h2>
          </div>

          <div className="p-6 space-y-6">
            <div className="relative">
              <textarea
                placeholder="Describe the 3D model you want to generate..."
                className="w-full h-32 p-4 pb-12 bg-background border border-input rounded-2xl resize-none outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] text-sm text-foreground/65 placeholder:text-muted-foreground transition-all duration-300"
                disabled={true}
              />
              <div className="absolute bottom-4 right-4 flex items-center justify-center w-7 h-7 bg-gradient-to-r from-blue-600/60 to-cyan-600/60 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full font-medium transition-all opacity-50 cursor-not-allowed">
                <SendHorizontal className="w-4 h-4" />
              </div>
            </div>

            <div className="pt-4 border-border">
              <div className="flex items-center justify-center gap-2 mb-3 text-sm text-muted-foreground">
                Coming Soon...
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {["Generate a chair", "Create a table", "Design a lamp"].map(
                  (suggestion, index) => (
                    <button
                      key={index}
                      disabled={true}
                      className="px-3 py-2 text-xs bg-secondary dark:bg-transparent dark:border dark:border-gray-700 text-secondary-foreground dark:text-gray-400 rounded-full border border-border opacity-50 cursor-not-allowed transition-all duration-200"
                    >
                      {suggestion}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
