/**
 * Copyright 2025 Loïc Muhirwa
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface DocumentViewerProps {
  content: string;
  onClose: () => void;
}

export default function DocumentViewer({
  content,
  onClose,
}: DocumentViewerProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>("");
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Constraints
  const MIN_WIDTH = 400;
  const MIN_HEIGHT = 300;
  const MAX_WIDTH = window.innerWidth * 0.95;
  const MAX_HEIGHT = window.innerHeight * 0.95;

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        !isResizing
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, isResizing]);

  // Handle resize functionality
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: dimensions.width,
      height: dimensions.height,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      let newWidth = resizeStartRef.current.width;
      let newHeight = resizeStartRef.current.height;

      // Handle different resize directions
      if (
        resizeDirection.includes("right") ||
        resizeDirection === "se" ||
        resizeDirection === "ne"
      ) {
        newWidth = resizeStartRef.current.width + deltaX;
      }
      if (
        resizeDirection.includes("left") ||
        resizeDirection === "sw" ||
        resizeDirection === "nw"
      ) {
        newWidth = resizeStartRef.current.width - deltaX;
      }
      if (
        resizeDirection.includes("bottom") ||
        resizeDirection === "se" ||
        resizeDirection === "sw"
      ) {
        newHeight = resizeStartRef.current.height + deltaY;
      }
      if (
        resizeDirection.includes("top") ||
        resizeDirection === "ne" ||
        resizeDirection === "nw"
      ) {
        newHeight = resizeStartRef.current.height - deltaY;
      }

      // Apply constraints
      newWidth = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
      newHeight = Math.min(Math.max(newHeight, MIN_HEIGHT), MAX_HEIGHT);

      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection("");
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // Set appropriate cursor based on resize direction
      const cursor =
        resizeDirection === "se" || resizeDirection === "nw"
          ? "nw-resize"
          : resizeDirection === "sw" || resizeDirection === "ne"
          ? "ne-resize"
          : resizeDirection === "top" || resizeDirection === "bottom"
          ? "ns-resize"
          : resizeDirection === "left" || resizeDirection === "right"
          ? "ew-resize"
          : "se-resize";

      document.body.style.cursor = cursor;
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [
    isResizing,
    resizeDirection,
    MIN_WIDTH,
    MIN_HEIGHT,
    MAX_WIDTH,
    MAX_HEIGHT,
  ]);

  // Prevent scrolling of background
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"
    >
      <div
        ref={contentRef}
        className="bg-card rounded-3xl shadow-pronounced-xl overflow-hidden transition-transform duration-300 animate-in fade-in slide-in-from-bottom-4 relative"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          minWidth: `${MIN_WIDTH}px`,
          minHeight: `${MIN_HEIGHT}px`,
          maxWidth: `${MAX_WIDTH}px`,
          maxHeight: `${MAX_HEIGHT}px`,
        }}
      >
        <div className="flex items-center justify-between p-6 border-border">
          <h2 className="text-xl ml-4 opacity-65 text-card-foreground">
            Document Viewer
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Close viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div
          className="p-8 overflow-y-auto"
          style={{ height: `${dimensions.height - 120}px` }}
        >
          <div className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
        <div className="p-4 border-border flex justify-end"></div>

        {/* Resize handles */}
        {/* Corner handles */}
        <div
          className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize bg-gray-400/20 hover:bg-gray-400/40 transition-colors"
          onMouseDown={(e) => handleResizeStart(e, "nw")}
        />
        <div
          className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize bg-gray-400/20 hover:bg-gray-400/40 transition-colors"
          onMouseDown={(e) => handleResizeStart(e, "ne")}
        />
        <div
          className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize bg-gray-400/20 hover:bg-gray-400/40 transition-colors"
          onMouseDown={(e) => handleResizeStart(e, "sw")}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-400/20 hover:bg-gray-400/40 transition-colors"
          onMouseDown={(e) => handleResizeStart(e, "se")}
          style={{
            clipPath: "polygon(100% 0%, 0% 100%, 100% 100%)",
          }}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2">
            <div className="absolute bottom-0 right-0 w-1 h-1 bg-gray-600 dark:bg-gray-400"></div>
            <div className="absolute bottom-0 right-2 w-1 h-1 bg-gray-600 dark:bg-gray-400"></div>
            <div className="absolute bottom-2 right-0 w-1 h-1 bg-gray-600 dark:bg-gray-400"></div>
          </div>
        </div>

        {/* Edge handles */}
        <div
          className="absolute top-0 left-4 right-4 h-2 cursor-ns-resize bg-gray-400/10 hover:bg-gray-400/20 transition-colors"
          onMouseDown={(e) => handleResizeStart(e, "top")}
        />
        <div
          className="absolute bottom-0 left-4 right-4 h-2 cursor-ns-resize bg-gray-400/10 hover:bg-gray-400/20 transition-colors"
          onMouseDown={(e) => handleResizeStart(e, "bottom")}
        />
        <div
          className="absolute left-0 top-4 bottom-4 w-2 cursor-ew-resize bg-gray-400/10 hover:bg-gray-400/20 transition-colors"
          onMouseDown={(e) => handleResizeStart(e, "left")}
        />
        <div
          className="absolute right-0 top-4 bottom-4 w-2 cursor-ew-resize bg-gray-400/10 hover:bg-gray-400/20 transition-colors"
          onMouseDown={(e) => handleResizeStart(e, "right")}
        />
      </div>
    </div>
  );
}
