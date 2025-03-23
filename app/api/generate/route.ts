import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { prompt, aspectRatio } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // For demo purposes, return a placeholder image
    // In production, you would call the Stability API
    const placeholderWidth = aspectRatio === "16:9" ? 1024 : 512
    const placeholderHeight = aspectRatio === "9:16" ? 1024 : 512

    const placeholderUrl = `https://picsum.photos/${placeholderWidth}/${placeholderHeight}`
    const imageResponse = await fetch(placeholderUrl)

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch placeholder image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()

    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })

    /* Uncomment this for actual Stability API integration
    const response = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height: aspectRatio === "9:16" ? 1024 : 768,
        width: aspectRatio === "16:9" ? 1024 : 768,
        samples: 1,
        steps: 30,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to generate image");
    }

    const responseData = await response.json();
    const base64Image = responseData.artifacts[0].base64;
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Image, "base64");
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
    */
  } catch (error) {
    console.error("Error generating image:", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}

