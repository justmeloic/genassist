import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt, content } = await request.json()

    if (!prompt || !content) {
      return NextResponse.json({ error: "Prompt and content are required" }, { status: 400 })
    }

    // For demo purposes, we'll simulate an AI response
    // In a real application, you would use your actual Gemini API key
    const simulatedResponse = await simulateAIResponse(prompt, content)

    return NextResponse.json({ text: simulatedResponse })

    // Uncomment below for actual Gemini API integration:
    /*
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Please help improve this document based on the following request: "${prompt}"\n\nOriginal document:\n${content}\n\nPlease return only the improved version of the document, without any additional commentary.`
            }]
          }]
        }),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get response from Gemini API')
    }

    const data = await response.json()
    const generatedText = data.candidates[0].content.parts[0].text

    return NextResponse.json({ text: generatedText })
    */
  } catch (error) {
    console.error("Error in generate API:", error)
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
  }
}

// Simulated AI response for demo purposes
async function simulateAIResponse(prompt: string, content: string): Promise<string> {
  // Add a delay to simulate API call
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const lowerPrompt = prompt.toLowerCase()

  if (lowerPrompt.includes("spelling") || lowerPrompt.includes("grammar")) {
    return (
      content
        .replace(/teh/g, "the")
        .replace(/recieve/g, "receive")
        .replace(/seperate/g, "separate")
        .replace(/occured/g, "occurred") +
      "\n\n[Note: This is a simulated response. Spelling and grammar have been checked.]"
    )
  }

  if (lowerPrompt.includes("professional")) {
    return (
      content.replace(/!/g, ".") +
      "\n\nFurthermore, this document has been enhanced with a more professional tone to ensure clarity and formality in communication."
    )
  }

  if (lowerPrompt.includes("concise")) {
    const sentences = content.split(". ")
    const shortened = sentences.slice(0, Math.max(1, Math.floor(sentences.length * 0.7))).join(". ")
    return shortened + (shortened.endsWith(".") ? "" : ".")
  }

  if (lowerPrompt.includes("details") || lowerPrompt.includes("examples")) {
    return (
      content +
      "\n\nAdditional Context: This enhanced version includes more comprehensive details and practical examples to better illustrate the key concepts discussed above."
    )
  }

  // Default response
  return content + "\n\n[Enhanced by AI: This document has been improved based on your request.]"
}
