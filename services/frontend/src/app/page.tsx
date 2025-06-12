"use client";
import Link from "next/link";
import { ArrowRight, FileText, Sparkles, Headphones } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1 h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between p-4">
        <div className="w-[180px]" />
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center"
        ></Link>
      </div>
      <main className="flex-1 flex flex-col items-center w-full relative">
        <div className="flex flex-col items-center justify-center h-[400px] space-y-10">
          <h1 className="text-center text-5xl font-bold">
            <span className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
              Document Editor
            </span>
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-8 justify-center px-4">
            <div className="flex items-center px-6 py-3 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 flex items-center justify-center mx-2">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-lg text-gray-800 dark:text-gray-200">
                Document
              </span>
            </div>
            <ArrowRight className="text-gray-400" />
            <div className="flex items-center px-6 py-3 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 flex items-center justify-center mx-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-lg text-gray-800 dark:text-gray-200">
                AI Enhancement
              </span>
            </div>
            <ArrowRight className="text-gray-400" />
            <div className="flex items-center px-6 py-3 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 flex items-center justify-center mx-2">
                <Headphones className="w-6 h-6 text-pink-500" />
              </div>
              <span className="text-lg text-gray-800 dark:text-gray-200">
                Audio Generation
              </span>
            </div>
          </div>

          <Link
            href="/editor"
            className="mt-8 px-8 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Open Editor
          </Link>

          <h3 className="text-center text-sm font-bold w-[450px] max-w-full px-4">
            <span className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
              Edit documents with AI suggestions and visual diff approval
            </span>
          </h3>
        </div>
      </main>
    </div>
  );
}
