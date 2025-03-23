import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getUserImages } from "@/lib/db-prisma"

export async function GET(req: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get user's images from database
    const images = await getUserImages(session.user.id)

    // Format the response
    const formattedImages = images.map((img) => ({
      id: img.id,
      url: img.imageData, // This is the base64 data
      prompt: img.prompt,
      aspectRatio: img.aspectRatio || "1:1",
      createdAt: img.createdAt.toISOString(),
      isBase64: true, // Flag to indicate this is a base64 image
    }))

    return NextResponse.json(formattedImages)
  } catch (error) {
    console.error("Error fetching images:", error)
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 })
  }
}

