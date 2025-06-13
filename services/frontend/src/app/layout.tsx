"use client";

import "../styles/globals.css";
import type React from "react";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/theme-provider";
import { ClientLayout } from "./client-layout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
