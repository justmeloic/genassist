"use client";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import Link from "next/link";

export function Header() {
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
        <div className="flex items-center pr-8">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
