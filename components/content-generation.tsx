"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Download, Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ContentFormData {
  contentType: "heading" | "subheading" | "paragraph"
  context: string
  targetAudience: string
  tone: string
  wordLength: number
}

interface SavedContent {
  id: string
  title: string
  content: string
  contentType: string
  createdAt: string
}

export function ContentGeneration() {
  const { data: session } = useSession()
  const [formData, setFormData] = useState<ContentFormData>({
    contentType: "paragraph",
    context: "",
    targetAudience: "general",
    tone: "professional",
    wordLength: 200,
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [savedContent, setSavedContent] = useState<SavedContent[]>([])
  const { toast } = useToast()

  // Fetch user's past content
  useEffect(() => {
    const fetchSavedContent = async () => {
      if (session?.user?.id) {
        try {
          const response = await axios.get("/api/content/history")
          if (response.status === 200) {
            setSavedContent(response.data)
          }
        } catch (error) {
          console.error("Error fetching saved content:", error)
          toast({
            title: "Error",
            description: "Failed to load your content history",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    fetchSavedContent()
  }, [session, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerate = async () => {
    if (!formData.context) {
      toast({
        title: "Missing information",
        description: "Please provide context for the content",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedContent(null)

    try {
      const response = await axios.post("/api/content/generate", formData)

      if (response.status === 200) {
        const { content } = response.data
        setGeneratedContent(content)

        // Save to database
        const saveResponse = await axios.post("/api/content/save", {
          title:
            formData.contentType === "heading"
              ? "Heading"
              : formData.contentType === "subheading"
                ? "Subheading"
                : "Paragraph",
          content,
          contentType: formData.contentType,
        })

        if (saveResponse.status === 200) {
          // Refresh saved content
          const historyResponse = await axios.get("/api/content/history")
          if (historyResponse.status === 200) {
            setSavedContent(historyResponse.data)
          }
        }
      } else {
        throw new Error(`Error ${response.status}`)
      }
    } catch (error) {
      toast({
        title: "Error generating content",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (content: string = generatedContent || "") => {
    if (content) {
      navigator.clipboard.writeText(content)
      toast({
        title: "Copied",
        description: "Content copied to clipboard",
      })
    }
  }

  const handleDownload = (content: string = generatedContent || "", title = "generated-content") => {
    if (content) {
      const blob = new Blob([content], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${title}.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await axios.delete(`/api/content/${id}`)
      if (response.status === 200) {
        setSavedContent(savedContent.filter((content) => content.id !== id))
        toast({
          title: "Success",
          description: "Content deleted successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete content",
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
              <Label htmlFor="contentType" className="font-pixel text-xs">
                Content Type
              </Label>
              <Select
                value={formData.contentType}
                onValueChange={(value) =>
                  handleSelectChange("contentType", value as "heading" | "subheading" | "paragraph")
                }
              >
                <SelectTrigger id="contentType">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heading">Heading</SelectItem>
                  <SelectItem value="subheading">Subheading</SelectItem>
                  <SelectItem value="paragraph">Paragraph</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context" className="font-pixel text-xs">
                Context
              </Label>
              <Textarea
                id="context"
                name="context"
                placeholder="Describe what you need content for (e.g., 'About page for a tech startup', 'Product description for a coffee maker')"
                value={formData.context}
                onChange={handleInputChange}
                className="min-h-[100px] font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience" className="font-pixel text-xs">
                Target Audience
              </Label>
              <Select
                value={formData.targetAudience}
                onValueChange={(value) => handleSelectChange("targetAudience", value)}
              >
                <SelectTrigger id="targetAudience">
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone" className="font-pixel text-xs">
                Tone
              </Label>
              <Select value={formData.tone} onValueChange={(value) => handleSelectChange("tone", value)}>
                <SelectTrigger id="tone">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !formData.context}
              className="w-full font-pixel text-xs"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Content"
              )}
            </Button>
          </div>

          <div>
            {generatedContent ? (
              <Card className="border-2 border-primary pixel-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="font-pixel text-sm">Generated Content</CardTitle>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleCopy()}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDownload()}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[400px] overflow-auto rounded bg-muted p-4">
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{generatedContent}</pre>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground bg-muted/20">
                <p className="text-center text-sm text-muted-foreground">
                  {isGenerating ? <Loader2 className="h-8 w-8 animate-spin" /> : "Generated content will appear here"}
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
          <div className="space-y-4">
            {savedContent.length > 0 ? (
              savedContent.map((content) => (
                <Card key={content.id} className="border-2 border-muted hover:border-primary">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-pixel text-sm">
                      {content.contentType.charAt(0).toUpperCase() + content.contentType.slice(1)}: {content.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleCopy(content.content)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDownload(content.content, content.title)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(content.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[200px] overflow-hidden rounded bg-muted p-4">
                      <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed line-clamp-3">
                        {content.content}
                      </pre>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Created on {new Date(content.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground bg-muted/20">
                <p className="text-center text-sm text-muted-foreground">No saved content found</p>
              </div>
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

