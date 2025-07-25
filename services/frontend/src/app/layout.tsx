"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { ThemeProvider } from "@/components/theme-provider";
import { usePathname } from "next/navigation";
import type React from "react";
import "../styles/globals.css";
import { ClientLayout } from "./client-layout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't protect the login page
  const isLoginPage = pathname === "/login";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Genassist</title>
        <link rel="icon" href="/logo-avatar-icon.png" type="image/svg+xml" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {isLoginPage ? (
            // Login page without protection
            children
          ) : (
            // Protected pages
            <ProtectedRoute>
              <ClientLayout>{children}</ClientLayout>
            </ProtectedRoute>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
