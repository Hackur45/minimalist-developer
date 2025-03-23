import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { saveRemovedBackground } from "@/lib/db-prisma"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const imageFile = formData.get("image") as File
    const prompt = formData.get("prompt") as string

    if (!imageFile) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    console.log("Received background removal image:", imageFile.name, "Size:", imageFile.size)

    try {
      // Save to database with base64 encoded image
      const imageId = await saveRemovedBackground(session.user.id, {
        prompt: prompt || "Background removed image",
        file: imageFile,
      })

      // Create a temporary URL for immediate display in the UI
      const tempUrl = URL.createObjectURL(imageFile)

      return NextResponse.json({
        success: true,
        imageId,
        tempUrl,
        isBase64: true,
      })
    } catch (dbError) {
      console.error("Database error when saving background removal:", dbError)
      return NextResponse.json(
        { error: "Database error: " + (dbError instanceof Error ? dbError.message : String(dbError)) },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in background removal save API route:", error)
    return NextResponse.json(
      { error: "Failed to save background removal: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}

