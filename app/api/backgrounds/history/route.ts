import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getUserBackgrounds } from "@/lib/db-prisma"

export async function GET(req: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get user's background removals from database
    const backgrounds = await getUserBackgrounds(session.user.id)

    // Format the response
    const formattedBackgrounds = backgrounds.map((bg) => ({
      id: bg.id,
      url: bg.imageData, // This is the base64 data
      prompt: bg.prompt || "Background removed image",
      createdAt: bg.createdAt.toISOString(),
      isBase64: true, // Flag to indicate this is a base64 image
    }))

    return NextResponse.json(formattedBackgrounds)
  } catch (error) {
    console.error("Error fetching backgrounds:", error)
    return NextResponse.json({ error: "Failed to fetch backgrounds" }, { status: 500 })
  }
}

