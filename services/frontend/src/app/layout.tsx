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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
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
