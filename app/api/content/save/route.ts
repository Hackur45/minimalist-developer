import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { saveGeneratedContent } from "@/lib/db-prisma"

export async function POST(req: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { title, content, contentType } = await req.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Save to database
    const contentId = await saveGeneratedContent(session.user.id, {
      title: title || "Generated Content",
      content,
      contentType: contentType || "paragraph",
    })

    return NextResponse.json({ success: true, contentId })
  } catch (error) {
    console.error("Error saving content:", error)
    return NextResponse.json({ error: "Failed to save content" }, { status: 500 })
  }
}

