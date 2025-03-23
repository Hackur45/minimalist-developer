"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Copy, Trash2, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ImageData {
  id: string
  url: string
  prompt: string
  createdAt: string
  isBase64?: boolean
}

interface PastImagesProps {
  images: ImageData[]
  onDelete?: (id: string) => void
}

export function PastImages({ images, onDelete }: PastImagesProps) {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)
  const { toast } = useToast()

  const handleCopy = (url: string, isBase64 = false) => {
    if (isBase64) {
      // For base64 images, we copy a shorter version
      navigator.clipboard.writeText("Base64 image (too large to copy directly)")
      toast({
        title: "Copied",
        description: "Image reference copied to clipboard",
      })
    } else {
      navigator.clipboard.writeText(url)
      toast({
        title: "Copied",
        description: "Image URL copied to clipboard",
      })
    }
  }

  const handleDownload = (url: string, isBase64 = false) => {
    if (isBase64) {
      // For base64 images
      const link = document.createElement("a")
      link.href = url
      link.download = "image.png"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // For regular URLs
      const link = document.createElement("a")
      link.href = url
      link.download = "image.png"
      link.target = "_blank"
      link.click()
    }
  }

  if (images.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground bg-muted/20">
        <p className="text-center text-sm text-muted-foreground">No past images found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image) => (
          <Card
            key={image.id}
            className="group relative overflow-hidden border-2 border-muted transition-all hover:border-primary"
          >
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <Image
                  src={image.url || "/placeholder.svg"}
                  alt={image.prompt}
                  fill
                  className="object-cover"
                  unoptimized={true} // Important for base64 images
                  onError={(e) => {
                    console.error(`Error loading image: ${image.id}`)
                    // Fallback to placeholder
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                  }}
                />
                <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex justify-end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 rounded-full bg-black/50 text-white"
                          onClick={() => setSelectedImage(image)}
                        >
                          <Info className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="font-pixel text-sm">Image Details</DialogTitle>
                          <DialogDescription>
                            Created on {new Date(image.createdAt).toLocaleDateString()}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="relative aspect-square w-full">
                            <Image
                              src={image.url || "/placeholder.svg"}
                              alt={image.prompt}
                              fill
                              className="rounded-md object-cover"
                              unoptimized={true}
                            />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-pixel text-xs">Prompt</h3>
                            <p className="text-sm text-muted-foreground">{image.prompt}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full bg-black/50 text-white"
                      onClick={() => handleCopy(image.url, image.isBase64)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full bg-black/50 text-white"
                      onClick={() => handleDownload(image.url, image.isBase64)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    {onDelete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-full bg-black/50 text-white"
                        onClick={() => onDelete(image.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

