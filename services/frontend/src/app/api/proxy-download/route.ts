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

import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const fileUrl = url.searchParams.get("url")

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
    }

    // Fetch the file from the original URL
    const response = await fetch(fileUrl)

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch file: ${response.status}` }, { status: response.status })
    }

    // Get the file content and content type
    const fileContent = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "application/octet-stream"

    // Create a new response with the file content and appropriate headers
    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileUrl.split("/").pop()}"`,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Error in proxy download route:", error)
    return NextResponse.json({ error: "Failed to proxy download" }, { status: 500 })
  }
}
