import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { contentType, context, targetAudience, tone, wordLength } = await req.json()

    if (!context) {
      return NextResponse.json({ error: "Context is required" }, { status: 400 })
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Create prompt based on content type
    let prompt = ""
    switch (contentType) {
      case "heading":
        prompt = `Generate a compelling heading for: ${context}. 
                  Target audience: ${targetAudience}. 
                  Tone: ${tone}. 
                  Keep it concise and attention-grabbing.`
        break
      case "subheading":
        prompt = `Generate a descriptive subheading for: ${context}. 
                  Target audience: ${targetAudience}. 
                  Tone: ${tone}. 
                  It should support the main heading and provide more context.`
        break
      case "paragraph":
        prompt = `Write a ${wordLength}-word paragraph about: ${context}. 
                  Target audience: ${targetAudience}. 
                  Tone: ${tone}. 
                  The content should be engaging and informative.`
        break
      default:
        prompt = `Generate content for: ${context}. 
                  Target audience: ${targetAudience}. 
                  Tone: ${tone}. 
                  Length: approximately ${wordLength} words.`
    }

    // Generate content
    const result = await model.generateContent(prompt)
    const response = await result.response
    const content = response.text()

    return NextResponse.json({ content })
  } catch (error) {
    console.error("Error generating content:", error)
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
  }
}

