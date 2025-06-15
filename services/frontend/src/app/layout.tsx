"use client";

import "../styles/globals.css";
import type React from "react";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/theme-provider";
import { ClientLayout } from "./client-layout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const hasCleared = window.localStorage.getItem("storage-cleared"); // Loïc: So we only clear the localStorage on the first reload

    if (!hasCleared) {
      const timer = setTimeout(() => {
        try {
          window.localStorage.clear();
          window.localStorage.setItem("storage-cleared", "true");
          console.log("LocalStorage cleared successfully");
        } catch (error) {
          console.error("Failed to clear localStorage:", error);
        }
      }, 100); // Loïc: a small delay to ensure the code runs after hydration

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
