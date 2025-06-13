"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
        <main className="flex-1 transition-all duration-300">{children}</main>
      </div>
    </div>
  );
}
