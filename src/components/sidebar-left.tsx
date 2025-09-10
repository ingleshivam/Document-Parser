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
} from "@/components/ui/sidebar";

// Sample data for uploaded files
const uploadedFiles = [
  {
    id: "1",
    name: "shivaji.pdf",
    size: "2.4 MB",
    uploadDate: "2024-01-15",
    uploadTime: "14:30",
    pages: 15,
    status: "SUCCESS",
  },
  {
    id: "2",
    name: "contract_agreement.pdf",
    size: "1.8 MB",
    uploadDate: "2024-01-14",
    uploadTime: "09:15",
    pages: 8,
    status: "PROCESSING",
  },
  {
    id: "3",
    name: "research_paper.pdf",
    size: "5.2 MB",
    uploadDate: "2024-01-13",
    uploadTime: "16:20",
    pages: 32,
    status: "SUCCESS",
  },
  {
    id: "4",
    name: "financial_report.pdf",
    size: "3.1 MB",
    uploadDate: "2024-01-12",
    uploadTime: "11:45",
    pages: 24,
    status: "SUCCESS",
  },
  {
    id: "5",
    name: "user_manual.pdf",
    size: "4.7 MB",
    uploadDate: "2024-01-11",
    uploadTime: "13:20",
    pages: 18,
    status: "SUCCESS",
  },
];

// Sample chat history with answers
const chatHistory = [
  {
    id: "1",
    fileId: "1",
    question: "What is the main topic of this document?",
    answer:
      "The document discusses the life and achievements of Chhatrapati Shivaji Maharaj, focusing on his military strategies and administrative reforms.",
    timestamp: "2024-01-15 14:30",
  },
  {
    id: "2",
    fileId: "1",
    question: "Summarize the key points",
    answer:
      "Key points include: 1) Military innovations, 2) Fort construction, 3) Naval development, 4) Administrative systems, 5) Religious tolerance policies.",
    timestamp: "2024-01-15 14:45",
  },
  {
    id: "3",
    fileId: "3",
    question: "What are the research findings?",
    answer:
      "The research found significant improvements in efficiency metrics, with a 23% increase in productivity and 15% reduction in operational costs.",
    timestamp: "2024-01-13 16:20",
  },
  {
    id: "4",
    fileId: "4",
    question: "What is the revenue breakdown?",
    answer:
      "Revenue breakdown: Q1: $2.3M, Q2: $2.8M, Q3: $3.1M, Q4: $3.5M. Total annual revenue: $11.7M with 22% YoY growth.",
    timestamp: "2024-01-12 15:30",
  },
  {
    id: "5",
    fileId: "5",
    question: "How do I install the software?",
    answer:
      "Installation steps: 1) Download installer, 2) Run as administrator, 3) Follow setup wizard, 4) Configure settings, 5) Restart system.",
    timestamp: "2024-01-11 14:15",
  },
];

// Calculate statistics
const totalDocuments = uploadedFiles.length;
const totalPages = uploadedFiles.reduce((sum, file) => sum + file.pages, 0);
const totalQuestions = chatHistory.length;
const lastUploadedFile = uploadedFiles.sort(
  (a, b) =>
    new Date(`${b.uploadDate} ${b.uploadTime}`).getTime() -
    new Date(`${a.uploadDate} ${a.uploadTime}`).getTime()
)[0];
const recentDocuments = uploadedFiles
  .sort(
    (a, b) =>
      new Date(`${b.uploadDate} ${b.uploadTime}`).getTime() -
      new Date(`${a.uploadDate} ${a.uploadTime}`).getTime()
  )
  .slice(0, 3);
const recentQuestions = chatHistory
  .sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  .slice(0, 3);

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

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    onSectionChange?.(section);
  };

  const handleFileSelect = (fileId: string | null) => {
    setSelectedFile(fileId);
    onFileSelect?.(fileId);
  };

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
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
              Document Parser
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              AI-Powered PDF Analysis
            </p>
          </div>
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
                      onClick={() => handleSectionChange("dashboard")}
                      className={
                        activeSection === "dashboard" ? "bg-accent" : ""
                      }
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
                    onClick={() => handleSectionChange("upload")}
                  >
                    <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Upload PDF</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSectionChange("chat")}
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
                    <SidebarMenuButton
                      onClick={() => handleSectionChange("upload")}
                      className={activeSection === "upload" ? "bg-accent" : ""}
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload & Manage</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>

                {/* File List */}
                <div className="mt-2 space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                        selectedFile === file.id
                          ? "bg-accent border-primary"
                          : ""
                      }`}
                      onClick={() => handleFileSelect(file.id)}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <File className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                            <span className="truncate">{file.size}</span>
                            <span>•</span>
                            <span>{file.pages}p</span>
                            <span>•</span>
                            <span className="truncate">{file.uploadDate}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <Badge
                            variant={
                              file.status === "SUCCESS"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs px-1.5 py-0.5 aspect-square"
                          >
                            {file.status === "SUCCESS" ? "✓" : "⏳"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            title="Delete file"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="my-2" />

            {/* Extracted Text / Data Section */}
            <SidebarGroup>
              <SidebarGroupLabel>Extracted Data</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleSectionChange("extracted")}
                      className={
                        activeSection === "extracted" ? "bg-accent" : ""
                      }
                    >
                      <FileText className="h-4 w-4" />
                      <span>View Extracted Text</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>

                {/* Document Metadata */}
                {selectedFile && (
                  <div className="mt-2">
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="text-sm font-medium mb-3 flex items-center">
                        <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Document Info</span>
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center min-w-0">
                          <span className="text-muted-foreground">Pages:</span>
                          <span className="font-medium">
                            {
                              uploadedFiles.find((f) => f.id === selectedFile)
                                ?.pages
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center min-w-0">
                          <span className="text-muted-foreground">Size:</span>
                          <span className="font-medium truncate">
                            {
                              uploadedFiles.find((f) => f.id === selectedFile)
                                ?.size
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center min-w-0">
                          <span className="text-muted-foreground">
                            Uploaded:
                          </span>
                          <span className="font-medium truncate">
                            {
                              uploadedFiles.find((f) => f.id === selectedFile)
                                ?.uploadDate
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center min-w-0">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge
                            variant={
                              uploadedFiles.find((f) => f.id === selectedFile)
                                ?.status === "SUCCESS"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs px-1.5 py-0.5 aspect-square"
                          >
                            {uploadedFiles.find((f) => f.id === selectedFile)
                              ?.status === "SUCCESS"
                              ? "✓"
                              : "⏳"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 mt-3">
                        <Button size="sm" className="flex-1 min-w-0">
                          <Download className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">Download</span>
                        </Button>
                        <Button size="sm" variant="outline" className="px-2">
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="my-2" />

            {/* Ask AI / Chat Section */}
            <SidebarGroup>
              <SidebarGroupLabel>AI Assistant</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleSectionChange("chat")}
                      className={activeSection === "chat" ? "bg-accent" : ""}
                    >
                      <Bot className="h-4 w-4" />
                      <span>Chat with Docs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleSectionChange("history")}
                      className={activeSection === "history" ? "bg-accent" : ""}
                    >
                      <History className="h-4 w-4" />
                      <span>Query History</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>

                {/* Chat History */}
                {activeSection === "history" && (
                  <div className="mt-2 space-y-1">
                    {chatHistory
                      .filter(
                        (chat) => !selectedFile || chat.fileId === selectedFile
                      )
                      .map((chat) => (
                        <div
                          key={chat.id}
                          className="p-2 rounded-lg border text-xs"
                        >
                          <p className="font-medium truncate">
                            {chat.question}
                          </p>
                          <p className="text-muted-foreground truncate">
                            {chat.timestamp}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="my-2" />

            {/* Settings */}
            <SidebarGroup>
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
            </SidebarGroup>
          </div>
        </ScrollArea>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
