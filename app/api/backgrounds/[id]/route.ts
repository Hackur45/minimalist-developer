import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { deleteBackground } from "@/lib/db-prisma"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = params

    // Delete background from database
    await deleteBackground(session.user.id, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting background:", error)
    return NextResponse.json({ error: "Failed to delete background" }, { status: 500 })
  }
}

