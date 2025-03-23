import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getUserContent } from "@/lib/db-prisma"

export async function GET(req: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get user's content from database
    const content = await getUserContent(session.user.id)

    // Format the response
    const formattedContent = content.map((item) => ({
      id: item.id,
      title: item.title || "Generated Content",
      content: item.content,
      contentType: item.contentType || "paragraph",
      createdAt: item.createdAt.toISOString(),
    }))

    return NextResponse.json(formattedContent)
  } catch (error) {
    console.error("Error fetching content:", error)
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}

