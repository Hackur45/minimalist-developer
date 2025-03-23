import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const imageFile = formData.get("image_file") as File

    if (!imageFile) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 })
    }

    // For demo purposes, return a placeholder transparent image
    // In production, you would call the Remove.bg API
    const placeholderUrl =
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/HD_transparent_picture.png/1200px-HD_transparent_picture.png"
    const imageResponse = await fetch(placeholderUrl)

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch placeholder image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()

    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })

    /* Uncomment this for actual Remove.bg API integration
    // Convert File to ArrayBuffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call Remove.bg API
    const apiFormData = new FormData();
    apiFormData.append("size", "auto");
    apiFormData.append("image_file", new Blob([buffer]), imageFile.name);

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVE_BG_API_KEY as string,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      throw new Error(`Remove.bg API error: ${response.status} ${response.statusText}`);
    }

    const resultArrayBuffer = await response.arrayBuffer();
    const resultBuffer = Buffer.from(resultArrayBuffer);

    return new NextResponse(resultBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
    */
  } catch (error) {
    console.error("Error removing background:", error)
    return NextResponse.json({ error: "Failed to remove background" }, { status: 500 })
  }
}

