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

import { Box } from "lucide-react";
import Rodin from "@/components/robin/rodin";

export default function ModelPage() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {" "}
        {/* Added container div with max width */}
        <div className="bg-card rounded-3xl dark:border dark:shadow-none border-border overflow-hidden shadow-card-hover hover:shadow-card-hover transition-shadow duration-300 ease-in-out">
          <div className="p-6 dark:border-b border-border">
            <h2 className="text-xl opacity-65 text-card-foreground flex items-center gap-3 ml-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Box className="w-4 h-4 text-white" />
              </div>
              3D Model Generator
            </h2>
          </div>

          <div className="relative h-[70vh] w-full ">
            <Rodin />
          </div>
        </div>
      </div>
    </main>
  );
}
