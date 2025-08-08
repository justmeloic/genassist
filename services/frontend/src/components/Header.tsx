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
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  // Don't show logout button on login page
  const showLogoutButton = isAuthenticated && pathname !== "/login";

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60  dark:border-b dark:border-gray shadow-[0_6px_9px_-1px_rgb(0,0,0,0.2),0_2px_4px_-2px_rgb(0,0,0,0.1)]">
      <div className="flex h-20 items-center justify-between">
        <div className="flex items-center gap-2 pl-4 ml-4">
          <Link href="/" className="w-[110px] h-[110px] relative">
            <Image
              src="/genassist-logo.png"
              alt="GenAssist Logo"
              fill
              className="object-contain"
              priority
            />
          </Link>
        </div>

        <div className="flex items-center pr-8 gap-4">
          <ThemeToggle />
          {showLogoutButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-white hover:bg-red-500/80 hover:border-red-400 hover:scale-105 rounded-3xl transition-all duration-200 dark:bg-secondary-dark dark:border-gray-500 dark:hover:text-white dark:hover:bg-red-500/80 dark:hover:border-red-400"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
