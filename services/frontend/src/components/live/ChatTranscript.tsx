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
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "bot";
  content: string;
  timestamp: number;
}

interface ChatTranscriptProps {
  chatHistory: ChatMessage[];
  isConnected: boolean;
}

export function ChatTranscript({
  chatHistory,
  isConnected,
}: ChatTranscriptProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const scrollHeight = chatContainerRef.current.scrollHeight;
      const height = chatContainerRef.current.clientHeight;
      const maxScrollTop = scrollHeight - height;
      chatContainerRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }
  };

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
    }
  }, [chatHistory, isExpanded]);

  if (!isConnected) {
    return null;
  }

  return (
    <div className=" border-gray-200 dark:border-gray-700">
      {/* Toggle Button */}
      <div className="flex justify-center p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 h-14 bg-blue-100 dark:bg-gray-700 rounded-full hover:bg-blue-200 dark:hover:bg-gray-600 transition-all duration-300 shadow-lg"
        >
          <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            View Chat Transcript
          </span>
          {chatHistory.length > 0 && (
            <span className="text-xs bg-blue-200 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
              {chatHistory.length}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Expandable Chat Content */}
      {isExpanded && (
        <div className="px-4 mb-4 max-w-2xl mx-auto">
          <div
            ref={chatContainerRef}
            className="max-h-80 overflow-y-auto relative bg-gray-50 dark:bg-gray-800/30 rounded-3xl"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <div className="p-4 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                  No messages yet. Start a conversation!
                </div>
              ) : (
                chatHistory.map((message, index) => (
                  <div key={`${message.timestamp}-${index}`}>
                    {message.role === "user" ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-start gap-2.5 max-w-[85%]">
                          <div className="prose prose-sm max-w-none inline-block p-3 px-4 rounded-3xl text-justify bg-blue-100 text-gray-800 rounded-tr-none dark:bg-blue-600 dark:text-white">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start">
                        <div className="flex items-start gap-2.5 max-w-[85%]">
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarImage
                              src="/logo-avatar-icon.png"
                              alt="AI Avatar"
                            />
                          </Avatar>
                          <div className="prose prose-sm max-w-none inline-block p-3 px-4 rounded-3xl text-justify bg-white text-gray-800 rounded-tl-none dark:bg-gray-700 dark:text-gray-200">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Top Gradient Overlay */}
            {chatHistory.length > 3 && (
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-gray-50 dark:from-gray-800/30 to-transparent z-10" />
            )}

            {/* Bottom Gradient Overlay */}
            {chatHistory.length > 3 && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-50 dark:from-gray-800/30 to-transparent z-10" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
