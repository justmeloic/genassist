"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="hidden lg:flex items-center space-x-3">
        <span className="text-xs opacity-65 font-medium text-muted-foreground">
          Light Mode
        </span>
        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
          <div className="h-4 w-4 rounded-full bg-white shadow-sm transition-transform" />
        </div>
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <>
      {/* Large screen toggle */}
      <div className="hidden lg:flex items-center space-x-3">
        <span className="text-xs opacity-65 font-medium text-muted-foreground">
          {isDark ? "Dark Mode" : "Light Mode"}
        </span>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isDark ? "bg-gray-600/30" : "bg-gray-200"
          }`}
          aria-label="Toggle theme"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full dark:bg-gray-300 bg-white shadow-sm transition-transform ${
              isDark ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Small screen toggle (icon only) */}
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
      >
        {isDark ? (
          <svg
            className="h-5 w-5 text-purple-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5 text-blue-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
        <span className="sr-only">Toggle theme</span>
      </button>
    </>
  );
}
