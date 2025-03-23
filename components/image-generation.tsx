"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Copy, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PastImages } from "@/components/past-images"

interface ImageData {
  id: string
  url: string
  prompt: string
  aspectRatio: string
  createdAt: string
  isBase64?: boolean
}

export function ImageGeneration() {
  const { data: session } = useSession()
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [pastImages, setPastImages] = useState<ImageData[]>([])
  const { toast } = useToast()

  // Fetch user's past images
  useEffect(() => {
    const fetchPastImages = async () => {
      if (session?.user?.id) {
        try {
          setIsLoading(true)
          const response = await axios.get("/api/images/history")
          if (response.status === 200) {
            setPastImages(response.data)
          }
        } catch (error) {
          console.error("Error fetching past images:", error)
          toast({
            title: "Error",
            description: "Failed to load your image history",
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

  // Handle Image Generation
  const handleGenerate = async () => {
    if (!prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await axios.post(
        "/api/generate",
        {
          prompt,
          aspectRatio,
        },
        {
          responseType: "blob",
        },
      )

      if (response.status === 200) {
        const tempImageUrl = URL.createObjectURL(response.data)
        setGeneratedImage(tempImageUrl)

        // Save to database
        const formData = new FormData()
        formData.append("image", response.data)
        formData.append("prompt", prompt)
        formData.append("aspectRatio", aspectRatio)

        try {
          console.log("Saving image to database...")
          const saveResponse = await axios.post("/api/images/save", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })

          console.log("Save response:", saveResponse.data)

          if (saveResponse.status === 200) {
            // Add to local state for immediate display
            const newImage: ImageData = {
              id: saveResponse.data.imageId,
              url: tempImageUrl, // Use the temporary URL for display
              prompt,
              aspectRatio,
              createdAt: new Date().toISOString(),
              isBase64: saveResponse.data.isBase64,
            }

            setPastImages((prev) => [newImage, ...prev])

            toast({
              title: "Success",
              description: "Image generated and saved successfully",
            })
          }
        } catch (saveError: any) {
          console.error("Error saving image:", saveError)
          console.error("Error details:", saveError.response?.data)

          // Still show the image even if saving fails
          toast({
            title: "Warning",
            description: `Image generated but could not be saved: ${saveError.response?.data?.error || saveError.message}`,
          })
        }
      } else {
        throw new Error(`Error ${response.status}`)
      }
    } catch (error: any) {
      console.error("Error generating image:", error)
      toast({
        title: "Error",
        description: `Failed to generate image: ${error.message}`,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle Image Download
  const handleDownload = (url: string = generatedImage || "") => {
    if (!url) return

    const link = document.createElement("a")
    link.href = url
    link.download = "generated_image.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle Image Copy
  const handleCopy = (url: string = generatedImage || "") => {
    if (url) {
      if (url.startsWith("data:")) {
        // For base64 images, we copy a shorter version
        navigator.clipboard.writeText("Base64 image (too large to copy directly)")
      } else {
        navigator.clipboard.writeText(url)
      }

      toast({
        title: "Copied",
        description: "Image reference copied to clipboard",
      })
    }
  }

  // Handle Image Delete
  const handleDelete = async (id: string) => {
    try {
      // Remove from local state first for immediate UI update
      setPastImages(pastImages.filter((image) => image.id !== id))

      // Then delete from database
      await axios.delete(`/api/images/${id}`)
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
    <Tabs defaultValue="generate" className="w-full">
      <TabsList className="mb-4 grid w-full grid-cols-2">
        <TabsTrigger value="generate" className="font-pixel text-xs">
          Generate
        </TabsTrigger>
        <TabsTrigger value="history" className="font-pixel text-xs">
          History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="generate" className="mt-0">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt" className="font-pixel text-xs">
                Prompt
              </Label>
              <Input
                id="prompt"
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aspect-ratio" className="font-pixel text-xs">
                Aspect Ratio
              </Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger id="aspect-ratio">
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating || !prompt} className="w-full font-pixel text-xs">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Image"
              )}
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center">
            {generatedImage ? (
              <Card className="w-full overflow-hidden border-2 border-primary pixel-border">
                <CardContent className="p-0">
                  <div className="relative aspect-square w-full">
                    <Image
                      src={generatedImage || "/placeholder.svg"}
                      alt="Generated image"
                      fill
                      className="animate-pixelate object-cover"
                      unoptimized={true}
                    />
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <Button size="icon" variant="secondary" onClick={() => handleCopy(generatedImage)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="secondary" onClick={() => handleDownload(generatedImage)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground bg-muted/20">
                <p className="text-center text-sm text-muted-foreground">
                  {isGenerating ? <Loader2 className="h-8 w-8 animate-spin" /> : "Generated image will appear here"}
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

