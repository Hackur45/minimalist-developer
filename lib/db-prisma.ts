import prisma from "./prisma"
import type { User } from "@prisma/client"

// Helper function to convert File to base64
export async function fileToBase64(file: File): Promise<string> {
  // In the server environment, we need to handle File objects differently
  return new Promise((resolve, reject) => {
    // For server-side processing, we need to read the file as an ArrayBuffer first
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const result = reader.result as string
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

// Alternative implementation for server-side
export async function bufferToBase64(buffer: ArrayBuffer, mimeType: string): Promise<string> {
  const base64 = Buffer.from(buffer).toString("base64")
  return `data:${mimeType};base64,${base64}`
}

// Helper function to get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  })
}

// Image generation functions
export async function saveGeneratedImage(
  userId: string,
  imageData: {
    prompt: string
    aspectRatio?: string
    file: File
  },
): Promise<string> {
  try {
    console.log("Starting image conversion to base64")

    // Get the array buffer from the file
    const arrayBuffer = await imageData.file.arrayBuffer()

    // Convert to base64
    const base64Image = await bufferToBase64(arrayBuffer, imageData.file.type)

    console.log("Base64 conversion complete, saving to database")

    const image = await prisma.generatedImage.create({
      data: {
        userId,
        prompt: imageData.prompt,
        aspectRatio: imageData.aspectRatio || "1:1",
        imageData: base64Image,
      },
    })

    console.log("Image saved to database with ID:", image.id)

    return image.id
  } catch (error) {
    console.error("Error in saveGeneratedImage:", error)
    throw error
  }
}

export async function getUserImages(userId: string) {
  return prisma.generatedImage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}

export async function getImageById(imageId: string) {
  return prisma.generatedImage.findUnique({
    where: { id: imageId },
  })
}

export async function deleteImage(userId: string, imageId: string) {
  return prisma.generatedImage.deleteMany({
    where: {
      id: imageId,
      userId,
    },
  })
}

// Background removal functions
export async function saveRemovedBackground(
  userId: string,
  imageData: {
    prompt?: string
    file: File
  },
): Promise<string> {
  try {
    // Get the array buffer from the file
    const arrayBuffer = await imageData.file.arrayBuffer()

    // Convert to base64
    const base64Image = await bufferToBase64(arrayBuffer, imageData.file.type)

    const image = await prisma.backgroundRemoval.create({
      data: {
        userId,
        prompt: imageData.prompt || "Background removed image",
        imageData: base64Image,
      },
    })

    return image.id
  } catch (error) {
    console.error("Error in saveRemovedBackground:", error)
    throw error
  }
}

export async function getUserBackgrounds(userId: string) {
  return prisma.backgroundRemoval.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}

export async function getBackgroundById(backgroundId: string) {
  return prisma.backgroundRemoval.findUnique({
    where: { id: backgroundId },
  })
}

export async function deleteBackground(userId: string, backgroundId: string) {
  return prisma.backgroundRemoval.deleteMany({
    where: {
      id: backgroundId,
      userId,
    },
  })
}

// Content generation functions
export async function saveGeneratedContent(
  userId: string,
  contentData: {
    title?: string
    content: string
    contentType?: string
  },
): Promise<string> {
  const content = await prisma.generatedContent.create({
    data: {
      userId,
      title: contentData.title || "Generated Content",
      content: contentData.content,
      contentType: contentData.contentType || "paragraph",
    },
  })

  return content.id
}

export async function getUserContent(userId: string) {
  return prisma.generatedContent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}

export async function deleteContent(userId: string, contentId: string) {
  return prisma.generatedContent.deleteMany({
    where: {
      id: contentId,
      userId,
    },
  })
}

