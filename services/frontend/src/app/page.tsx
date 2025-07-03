"use client";
import {
  AudioLines,
  Box,
  FileText,
  Headphones,
  Image,
  Sparkles,
  Video,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1 h-screen bg-background transition-colors duration-300">
      <div className="flex items-center justify-between p-4">
        <div className="w-[180px]" />
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center"
        ></Link>
      </div>
      <main className="flex-1 flex flex-col items-center w-full relative">
        <div className="flex flex-col items-center justify-center h-[400px] space-y-10">
          <h1 className="text-center text-2xl font-bold">
            <span className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
              AI Productivity System
            </span>
          </h1>

          <h3 className="text-center text-sm  font-bold w-[450px] max-w-full px-4">
            <span className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
              Discover our suite of AI-powered productivity tools
            </span>
          </h3>
          <div className="flex flex-wrap items-center gap-4 mt-8 justify-center px-4">
            <div className="flex items-center px-6 py-3 bg-background dark:bg-background rounded-full shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 flex items-center justify-center mx-2">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-base opacity-65 text-gray-800 dark:text-gray-200">
                Document Generation
              </span>
            </div>

            <div className="flex items-center px-6 py-3 bg-background dark:bg-background rounded-full shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 flex items-center justify-center mx-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-base opacity-65 text-gray-800 dark:text-gray-200">
                AI Enhancement
              </span>
            </div>

            <div className="flex items-center px-6 py-3 bg-background dark:bg-background rounded-full shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 flex items-center justify-center mx-2">
                <Headphones className="w-6 h-6 text-pink-500" />
              </div>
              <span className="text-base opacity-65 text-gray-800 dark:text-gray-200">
                Audio Generation
              </span>
            </div>

            <div className="flex items-center px-6 py-3 bg-background dark:bg-background rounded-full shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 flex items-center justify-center mx-2">
                <AudioLines className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-base opacity-65 text-gray-800 dark:text-gray-200">
                Real-time Streaming
              </span>
            </div>

            <div className="flex items-center px-6 py-3 bg-background dark:bg-background rounded-full shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 flex items-center justify-center mx-2">
                <Video className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-base opacity-65 text-gray-800 dark:text-gray-200">
                Video Generation
              </span>
            </div>
            <div className="flex items-center px-6 py-3 bg-background dark:bg-background rounded-full shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 flex items-center justify-center mx-2">
                <Image className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-base opacity-65 text-gray-800 dark:text-gray-200">
                Image Generation
              </span>
            </div>
            <div className="flex items-center px-6 py-3 bg-background dark:bg-background rounded-full shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 flex items-center justify-center mx-2">
                <Box className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-base opacity-65 text-gray-800 dark:text-gray-200">
                3D Model Generation
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href="/editor"
              className="mt-8 px-8 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Open DocGen
            </Link>
            <Link
              href="/video"
              className="mt-8 px-8 py-3 bg-gradient-to-r from-pink-500 to-green-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Open VideoGen
            </Link>
            <Link
              href="/image"
              className="mt-8 px-8 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Open ImageGen
            </Link>
            <Link
              href="/3dmodel"
              className="mt-8 px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Open 3DGen
            </Link>
            <Link
              href="/live"
              className="mt-8 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Open Live Streaming
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
