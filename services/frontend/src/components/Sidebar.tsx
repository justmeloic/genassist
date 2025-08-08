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

import { AudioLines, Box, FileText, Home, Image, Video } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ className, isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const homeLink = {
    title: "Home",
    icon: Home,
    variant: "default",
    href: "/",
  };

  const sidebarLinks = [
    {
      title: "Document Editor",
      icon: FileText,
      variant: "default",
      href: "/editor",
    },
    {
      title: "Video Generator",
      icon: Video,
      variant: "default",
      href: "/video",
    },
    {
      title: "Image Generator",
      icon: Image,
      variant: "default",
      href: "/image",
    },
    {
      title: "3D Model Viewer",
      icon: Box,
      variant: "default",
      href: "/3dmodel",
    },
    {
      title: "Real-time Streaming",
      icon: AudioLines,
      variant: "default",
      href: "/live",
    },
  ] as const;

  const renderLink = (link: typeof homeLink, index?: number) => {
    const Icon = link.icon;
    return isCollapsed && !isHovered ? (
      <Tooltip key={index} delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={link.href}
            className={cn(
              "flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-white/50 dark:hover:bg-gray-800/50 dark:text-gray-400",
              pathname === link.href &&
                "bg-[#d3e2fd] dark:bg-blue-950/60 text-primary dark:text-blue-200 hover:bg-[#d3e2fd]/90 dark:hover:bg-blue-950/80"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="sr-only">{link.title}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="flex items-center gap-4 text-xs"
        >
          {link.title}
        </TooltipContent>
      </Tooltip>
    ) : (
      <Link
        key={index}
        href={link.href}
        className={cn(
          "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-muted-foreground hover:bg-white/50 dark:hover:bg-gray-800/50 dark:text-gray-400",
          pathname === link.href &&
            "bg-[#d3e2fd] dark:bg-blue-950/60 text-primary dark:text-blue-200 hover:bg-[#d3e2fd]/90 dark:hover:bg-blue-950/80"
        )}
      >
        <Icon className="h-5 w-5" />
        {link.title}
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "relative flex h-screen flex-col gap-4 px-3 pb-3 pt-16 transition-all duration-300 bg-[#f0f4f8] dark:bg-gray-600/30 shadow-[2px_0_10px_0_rgba(0,0,0,0.1)] z-10 rounded-tr-xl rounded-br-xl border-r dark:border-0 border-gray-200",
        isCollapsed && !isHovered ? "w-[80px]" : "w-[250px]",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TooltipProvider>
        {/* Toggle Button */}
        <Button
          variant="ghost"
          className={cn(
            "absolute top-4 p-2 hover:bg-white/50 dark:hover:bg-gray-800/50",
            isCollapsed && !isHovered ? "left-1/2 -translate-x-1/2" : "left-4"
          )}
          onClick={onToggle}
        >
          <div className="flex flex-col space-y-1">
            <span className="w-4 h-0.5 bg-current"></span>
            <span className="w-4 h-0.5 bg-current"></span>
            <span className="w-4 h-0.5 bg-current"></span>
          </div>
          <span className="sr-only">Toggle Sidebar</span>
        </Button>

        {/* Home Link */}
        <div className="mb-4 mt-[60px]">{renderLink(homeLink)}</div>

        {/* Tools Section */}
        <div
          className={cn(
            "mb-2 font-semibold text-gray-700 dark:text-gray-300 text-sm",
            isCollapsed && !isHovered ? "text-center" : ""
          )}
        >
          Tools
        </div>
        <nav className="grid gap-1">
          {sidebarLinks.map((link, index) => renderLink(link, index))}
        </nav>
      </TooltipProvider>
    </div>
  );
}
