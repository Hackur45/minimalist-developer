"use client"

import { useState } from "react"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { ImageGeneration } from "@/components/image-generation"
import { BackgroundRemoval } from "@/components/background-removal"
import { ContentGeneration } from "@/components/content-generation"
import { UserNav } from "@/components/user-nav"
import { Footer } from "@/components/footer"
import { AuthCheck } from "@/components/auth-check"
import { Image, Wand2, FileType, Github } from "lucide-react"

type Tool = "image" | "background" | "content"

export function Dashboard() {
  const [activeTool, setActiveTool] = useState<Tool>("image")

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex flex-1">
          <Sidebar variant="inset" collapsible="icon">
            <SidebarHeader className="flex items-center justify-center p-4">
              <h1 className="font-pixel text-sm text-primary pixel-shadow">Minimalist Dev</h1>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeTool === "image"}
                    onClick={() => setActiveTool("image")}
                    tooltip="Image Generation"
                  >
                    <Wand2 className="h-4 w-4" />
                    <span>Image Gen</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeTool === "background"}
                    onClick={() => setActiveTool("background")}
                    tooltip="Background Removal"
                  >
                    <Image className="h-4 w-4" />
                    <span>BG Removal</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeTool === "content"}
                    onClick={() => setActiveTool("content")}
                    tooltip="Content Generation"
                  >
                    <FileType className="h-4 w-4" />
                    <span>Content Gen</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4">
              <div className="flex flex-col gap-2">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-md p-2 text-xs hover:bg-accent hover:text-accent-foreground"
                >
                  <Github className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">GitHub</span>
                </a>
                <ModeToggle />
              </div>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <div className="flex min-h-full flex-col">
              <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
                <h1 className="font-pixel text-xl text-primary pixel-shadow">
                  {activeTool === "image" && "Image Generation"}
                  {activeTool === "background" && "Background Removal"}
                  {activeTool === "content" && "Content Generation"}
                </h1>
                <UserNav />
              </header>
              <main className="flex-1 p-4 md:p-6">
                <AuthCheck>
                  {activeTool === "image" && <ImageGeneration />}
                  {activeTool === "background" && <BackgroundRemoval />}
                  {activeTool === "content" && <ContentGeneration />}
                </AuthCheck>
              </main>
              <Footer />
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}

