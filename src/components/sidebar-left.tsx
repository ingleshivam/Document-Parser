"use client";

import * as React from "react";
import {
  Home,
  Upload,
  FileText,
  MessageCircle,
  BarChart3,
  Plus,
  Trash2,
  Download,
  RefreshCw,
  File,
  Calendar,
  User,
  Hash,
  Clock,
  Bot,
  History,
  Settings,
  LogIn,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SidebarLeftProps extends React.ComponentProps<typeof Sidebar> {
  onSectionChange?: (section: string) => void;
  onFileSelect?: (fileId: string | null) => void;
}

export function SidebarLeft({
  onSectionChange,
  onFileSelect,
  ...props
}: SidebarLeftProps) {
  const [activeSection, setActiveSection] = React.useState("dashboard");
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const { data: session, status } = useSession();

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    onSectionChange?.(section);
  };

  const handleFileSelect = (fileId: string | null) => {
    setSelectedFile(fileId);
    onFileSelect?.(fileId);
  };

  const router = useRouter();

  return (
    <Sidebar
      className="border-r-0 dark:!bg-black [&[data-state='expanded']]:dark:!bg-black [&[data-state='collapsed']]:dark:!bg-black"
      {...props}
    >
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DP</span>
          </div>
          <Link href={"/home"}>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                Document Parser
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                AI-Powered PDF Analysis
              </p>
            </div>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="p-2 space-y-4">
            {/* Dashboard / Home Section */}
            <SidebarGroup>
              <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => router.push("/dashboard")}
                    >
                      <Home className="h-4 w-4" />
                      <span>Overview</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="my-2" />

            {/* Quick Actions */}
            <SidebarGroup>
              <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => router.push("/upload")}
                  >
                    <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Upload PDF</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push("/chat")}
                  >
                    <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Ask Question</span>
                  </Button>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="my-2" />

            {/* Upload / Manage Files Section */}
            <SidebarGroup>
              <SidebarGroupLabel>Files & Documents</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/upload")}>
                      <Upload className="h-4 w-4" />
                      <span>Upload & Manage</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/files")}>
                      <File className="h-4 w-4" />
                      <span>Markdown Files</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => router.push("/pdf-files")}
                    >
                      <FileText className="h-4 w-4" />
                      <span>PDF Files</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="my-1" />

            {/* Ask AI / Chat Section */}
            <SidebarGroup>
              <SidebarGroupLabel>AI Assistant</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/chat")}>
                      <Bot className="h-4 w-4" />
                      <span>Chat with Docs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* <Separator className="my-2" /> */}

            {/* Settings */}
            {/* <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleSectionChange("settings")}
                      className={
                        activeSection === "settings" ? "bg-accent" : ""
                      }
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup> */}

            <Separator className="my-2" />

            {/* Authentication */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {session ? (
                    <>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => router.push("user-dashboard")}
                        >
                          <User className="h-4 w-4" />
                          <span>Dashboard</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => signOut({ callbackUrl: "/home" })}
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </>
                  ) : (
                    <>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/auth/signin">
                            <LogIn className="h-4 w-4" />
                            <span>Sign In</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/auth/signup">
                            <User className="h-4 w-4" />
                            <span>Sign Up</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </ScrollArea>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
