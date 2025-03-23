import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { saveGeneratedImage } from "@/lib/db-prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const imageFile = formData.get("image") as File
    const prompt = formData.get("prompt") as string
    const aspectRatio = formData.get("aspectRatio") as string

    if (!imageFile || !prompt) {
      return NextResponse.json({ error: "Image and prompt are required" }, { status: 400 })
    }

    console.log("Received image file:", imageFile.name, "Size:", imageFile.size)

    try {
      const imageId = await saveGeneratedImage(session.user.id, {
        prompt,
        aspectRatio,
        file: imageFile,
      })

      const tempUrl = URL.createObjectURL(imageFile)

      return NextResponse.json({
        success: true,
        imageId,
        tempUrl,
        isBase64: true,
      })
    } catch (dbError) {
      console.error("Database error when saving image:", dbError)
      return NextResponse.json(
        { error: "Database error: " + (dbError instanceof Error ? dbError.message : String(dbError)) },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in image save API route:", error)
    return NextResponse.json(
      { error: "Failed to save image: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}

