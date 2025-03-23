"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Upload, Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PastImages } from "@/components/past-images"

interface ImageData {
  id: string
  url: string
  prompt: string
  createdAt: string
  isBase64?: boolean
}

export function BackgroundRemoval() {
  const { data: session } = useSession()
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [processedFile, setProcessedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pastImages, setPastImages] = useState<ImageData[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Fetch user's past background removals
  useEffect(() => {
    const fetchPastImages = async () => {
      if (session?.user?.id) {
        try {
          setIsLoading(true)
          const response = await axios.get("/api/backgrounds/history")
          if (response.status === 200) {
            setPastImages(response.data)
          }
        } catch (error) {
          console.error("Error fetching past images:", error)
          toast({
            title: "Error",
            description: "Failed to load your background removal history",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    fetchPastImages()
  }, [session, toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith("image/")) {
        setOriginalFile(file)
        const reader = new FileReader()
        reader.onload = (event) => {
          setOriginalImage(event.target?.result as string)
          setProcessedImage(null)
          setProcessedFile(null)
        }
        reader.readAsDataURL(file)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        })
      }
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (file.type.startsWith("image/")) {
        setOriginalFile(file)
        const reader = new FileReader()
        reader.onload = (event) => {
          setOriginalImage(event.target?.result as string)
          setProcessedImage(null)
          setProcessedFile(null)
        }
        reader.readAsDataURL(file)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        })
      }
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleRemoveBackground = async () => {
    if (!originalImage || !originalFile) return

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("image_file", originalFile)

      const response = await axios.post("/api/backgrounds/remove", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
      })

      if (response.status === 200) {
        const tempImageUrl = URL.createObjectURL(response.data)
        setProcessedImage(tempImageUrl)
        setProcessedFile(new File([response.data], "processed.png", { type: "image/png" }))

        try {
          // Save to database
          const saveFormData = new FormData()
          saveFormData.append("image", response.data)
          saveFormData.append("prompt", originalFile.name || "Background removed image")

          const saveResponse = await axios.post("/api/backgrounds/save", saveFormData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })

          if (saveResponse.status === 200) {
            // Add to local state for immediate display
            const newImage: ImageData = {
              id: saveResponse.data.imageId,
              url: saveResponse.data.tempUrl || tempImageUrl, // Use the temporary URL for display
              prompt: originalFile.name || "Background removed image",
              createdAt: new Date().toISOString(),
              isBase64: saveResponse.data.isBase64,
            }

            setPastImages((prev) => [newImage, ...prev])

            toast({
              title: "Success",
              description: "Background removed and saved successfully",
            })
          }
        } catch (saveError) {
          console.error("Error saving processed image:", saveError)
          // Still show the image even if saving fails
          toast({
            title: "Warning",
            description: "Background removed but could not be saved to history",
          })
        }
      } else {
        throw new Error(`Error ${response.status}`)
      }
    } catch (error) {
      console.error("Error removing background:", error)
      toast({
        title: "Error",
        description: "Failed to remove background",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = (url: string = processedImage || "") => {
    if (!url) return

    const link = document.createElement("a")
    link.href = url
    link.download = "processed-image.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleReset = () => {
    setOriginalImage(null)
    setOriginalFile(null)
    setProcessedImage(null)
    setProcessedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle Image Delete
  const handleDelete = async (id: string) => {
    try {
      // Remove from local state first for immediate UI update
      setPastImages(pastImages.filter((image) => image.id !== id))

      // Then delete from database
      await axios.delete(`/api/backgrounds/${id}`)
      toast({
        title: "Success",
        description: "Image deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting image:", error)
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      })
    }
  }

  return (
    <Tabs defaultValue="remove" className="w-full">
      <TabsList className="mb-4 grid w-full grid-cols-2">
        <TabsTrigger value="remove" className="font-pixel text-xs">
          Remove Background
        </TabsTrigger>
        <TabsTrigger value="history" className="font-pixel text-xs">
          History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="remove" className="mt-0">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div
              className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground bg-muted/20 p-4 transition-colors hover:border-primary"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {originalImage ? (
                <div className="relative h-full w-full">
                  <Image
                    src={originalImage || "/placeholder.svg"}
                    alt="Original image"
                    fill
                    className="animate-pixelate object-contain"
                    unoptimized={true}
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute right-2 top-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReset()
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="mb-1 text-center text-sm font-medium">Drag and drop an image here</p>
                  <p className="text-center text-xs text-muted-foreground">or click to browse</p>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            <Button
              onClick={handleRemoveBackground}
              disabled={isProcessing || !originalImage}
              className="w-full font-pixel text-xs"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Remove Background"
              )}
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center">
            {processedImage ? (
              <Card className="w-full overflow-hidden border-2 border-primary pixel-border">
                <CardContent className="p-0">
                  <div className="relative aspect-square w-full">
                    <Image
                      src={processedImage || "/placeholder.svg"}
                      alt="Processed image"
                      fill
                      className="animate-pixelate object-contain"
                      unoptimized={true}
                      style={{
                        backgroundImage:
                          'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4zjOaXUAAAAGlJREFUOE+ljEEOACEIA/0o/38ZthOXqHGjm5GkaQtUME6qO4Va/KS6J7wKwGIBVD8T+wCixIGgiiAWyAdFD/Z6CfO0/nKZqQSQfQxEDyZ6EEQI5gLwP2A6I3wD2D6i/TxQHzP8GPhkOyUOH8V8yPvvAAAAAElFTkSuQmCC")',
                        backgroundRepeat: "repeat",
                      }}
                    />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-2 right-2"
                      onClick={() => handleDownload(processedImage)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground bg-muted/20">
                <p className="text-center text-sm text-muted-foreground">
                  {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : "Processed image will appear here"}
                </p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="history" className="mt-0">
        {isLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <PastImages images={pastImages} onDelete={handleDelete} />
        )}
      </TabsContent>
    </Tabs>
  )
}

