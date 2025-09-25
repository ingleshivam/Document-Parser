"use client";

import { parseDocumentFromUrl } from "@/actions/parseDocumentFromUrl";
import { extractMarkdownOnly } from "@/actions/extractMarkdownOnly";
import { processDocumentForQdrant } from "@/actions/processDocumentForQdrant";
import { ThemeButton } from "@/components/theme-button";
import { Button } from "@/components/ui/button";
import { SidebarLeft } from "@/components/sidebar-left";
import { OverviewContent } from "@/components/overview-content";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { uploadPdfToBlob } from "@/actions/uploadPdfToBlob";
import { listMarkdownFiles } from "@/actions/listMarkdownFiles";
import { deleteMarkdownFile } from "@/actions/deleteMarkdownFile";
import { getMarkdownContent } from "@/actions/getMarkdownContent";
// Remove the old import since we're using the database version
import { queryDocument, ChatMessage } from "@/actions/queryDocument";
import { createFile, getFiles, updateFile } from "@/actions/db-files";
import {
  createConversation,
  getConversations,
  updateConversation,
} from "@/actions/db-conversations";
import {
  createMessage,
  getMessagesByConversationId,
} from "@/actions/db-messages";
import {
  createProcessedDocument,
  getProcessedDocuments as getDbProcessedDocuments,
} from "@/actions/db-processed-documents";
import { deleteProcessedDocumentWithQdrant } from "@/actions/deleteProcessedDocumentWithQdrant";
import { useSession, signOut } from "next-auth/react";

// Export the Conversation interface for use in other components
export interface Conversation {
  id: string;
  title: string;
  documentId: string;
  documentTitle: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// Database ProcessedDocument interface
export interface DbProcessedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  chunkCount: number;
  pageCount?: number | null;
  sourceUrl?: string | null;
  sourceFileName?: string | null;
  userId?: number | null;
  processedAt: Date;
}
import { toast } from "sonner";

interface ParseResult {
  success: boolean;
  text?: string;
  fileName?: string;
  blobUrl?: string;
  sourceUrl?: string;
  extractionDate?: string;
  sourceFileName?: string;
  error?: string;
}

interface MarkdownFile {
  url: string;
  fileName: string;
  size: number;
  uploadedAt: string;
  downloadUrl: string;
  sourceUrl?: string;
  sourceFileName?: string;
}

export default function Page() {
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [isExtractingMarkdown, setIsExtractingMarkdown] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [extractedMarkdown, setExtractedMarkdown] = useState<string | null>(
    null
  );
  const [markdownFiles, setMarkdownFiles] = useState<MarkdownFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [previewFile, setPreviewFile] = useState<MarkdownFile | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { data: session } = useSession();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (session) {
      setActiveSection("dashboard");
    }
  }, [session]);

  // Chat state
  const [processedDocuments, setProcessedDocuments] = useState<
    DbProcessedDocument[]
  >([]);
  const [selectedDocument, setSelectedDocument] =
    useState<DbProcessedDocument | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  // Conversation history state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [dbFiles, setDbFiles] = useState<any[]>([]);
  const [dbProcessedDocuments, setDbProcessedDocuments] = useState<
    DbProcessedDocument[]
  >([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pdfFiles, setPdfFiles] = useState<any[]>([]);
  const [isLoadingPdfFiles, setIsLoadingPdfFiles] = useState(false);

  // Generate conversation title from first question
  const generateConversationTitle = (question: string): string => {
    // Take first 50 characters and add ellipsis if longer
    const maxLength = 50;
    if (question.length <= maxLength) {
      return question;
    }
    return question.substring(0, maxLength).trim() + "...";
  };

  // Save conversation to database
  const saveConversation = async (
    conversation: Conversation,
    fileId?: string | null
  ) => {
    try {
      console.log(
        "Saving conversation:",
        conversation.id,
        "with",
        conversation.messages.length,
        "messages"
      );

      console.log(
        "Using fileId:",
        fileId,
        "for conversation:",
        conversation.id
      );

      // Check if conversation already exists
      const existingConversation = conversations.find(
        (c) => c.id === conversation.id
      );

      if (existingConversation) {
        console.log("Updating existing conversation");
        // Update existing conversation
        await updateConversation(conversation.id, {
          title: conversation.title,
          fileId: fileId || undefined,
        });
      } else {
        console.log("Creating new conversation");
        // Create new conversation
        const convResult = await createConversation({
          id: conversation.id,
          title: conversation.title,
          fileId: fileId || undefined,
        });

        if (!convResult.success) {
          console.error("Failed to create conversation:", convResult.error);
          return;
        }
      }

      // Get existing messages for this conversation
      const existingMessagesResult = await getMessagesByConversationId(
        conversation.id
      );
      const existingMessages = existingMessagesResult.success
        ? existingMessagesResult.messages
        : [];
      console.log(
        "Existing messages:",
        existingMessages?.length || 0,
        "New messages:",
        conversation.messages.length
      );

      // Save all messages (let the database handle duplicates)
      let savedCount = 0;
      for (let i = 0; i < conversation.messages.length; i++) {
        const message = conversation.messages[i];
        // Use a more unique ID that includes the message content hash
        const messageId = `${conversation.id}_${i}_${message.timestamp.replace(
          /[:.]/g,
          "_"
        )}`;

        try {
          const messageResult = await createMessage({
            id: messageId,
            conversationId: conversation.id,
            role: message.role,
            content: message.content,
          });
          if (messageResult.success) {
            savedCount++;
            console.log("Saved message:", messageId, "Role:", message.role);
          } else {
            console.error("Failed to save message:", messageResult.error);
          }
        } catch (error) {
          // If message already exists, that's okay
          if (
            error instanceof Error &&
            (error.message.includes("Unique constraint") ||
              error.message.includes("duplicate"))
          ) {
            console.log("Message already exists, skipping:", messageId);
          } else {
            console.error("Error saving message:", error);
          }
        }
      }
      console.log("Saved", savedCount, "new messages");

      // Reload conversations and trigger overview refresh
      await loadConversations();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  };

  // Load conversations from database
  const loadConversations = async () => {
    try {
      console.log("Loading conversations...");
      const result = await getConversations();
      console.log("Conversations result:", result);

      if (result.success && result.conversations) {
        console.log("Raw conversations from database:", result.conversations);
        const formattedConversations = result.conversations.map((conv: any) => {
          console.log(
            "Processing conversation:",
            conv.id,
            "with files:",
            conv.files
          );
          return {
            id: conv.id,
            title: conv.title,
            documentId: conv.fileId || "",
            documentTitle: (() => {
              // First try to get from files relationship
              if (conv.files?.sourceFileName) return conv.files.sourceFileName;
              if (conv.files?.fileName) return conv.files.fileName;

              // If no file relationship, try to find in processed documents
              if (conv.fileId) {
                const processedDoc = dbProcessedDocuments.find(
                  (doc) => doc.id === conv.fileId
                );
                if (processedDoc?.fileName) return processedDoc.fileName;
              }

              // Fallback
              return conv.files ? "Document" : "Unknown";
            })(),
            messages: (conv.messages || []).map((msg: any) => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.createdAt,
            })),
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
          };
        });
        console.log("Formatted conversations:", formattedConversations.length);
        console.log("Sample conversation:", formattedConversations[0]);
        setConversations(formattedConversations);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  // Start new conversation
  const startNewConversation = () => {
    setCurrentConversationId(null);
    setChatMessages([]);
    setSelectedDocument(null);
  };

  // Load conversation
  const loadConversation = async (conversationId: string) => {
    try {
      const result = await getMessagesByConversationId(conversationId);
      if (result.success && result.messages) {
        const messages = result.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt,
        }));
        setCurrentConversationId(conversationId);
        setChatMessages(messages);

        // Find the conversation to get document info
        const conversation = conversations.find((c) => c.id === conversationId);
        if (conversation) {
          setSelectedDocument({
            id: conversation.documentId,
            fileName: conversation.documentTitle,
            fileUrl: "",
            sourceUrl: "",
            processedAt: new Date(),
            chunkCount: 0,
          });
        }

        // Switch to chat section
        setActiveSection("chat");
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  // Load database files
  const loadDbFiles = async () => {
    try {
      console.log("Loading database files...");
      const result = await getFiles();
      console.log("Files result:", result);
      if (result.success && result.files) {
        setDbFiles(result.files);
        console.log("Loaded", result.files.length, "files from database");
      }
    } catch (error) {
      console.error("Error loading files:", error);
    }
  };

  // Load database processed documents
  const loadDbProcessedDocuments = async () => {
    try {
      const result = await getDbProcessedDocuments();
      if (result.success && result.processedDocuments) {
        setDbProcessedDocuments(result.processedDocuments);
      }
    } catch (error) {
      console.error("Error loading processed documents:", error);
    }
  };

  // Load PDF files from Vercel Blob and check markdown status
  const loadPdfFiles = async () => {
    console.log("Starting to load PDF files...");
    setIsLoadingPdfFiles(true);
    try {
      console.log("Current dbFiles:", dbFiles.length);
      console.log("Current markdownFiles:", markdownFiles.length);

      // Get all files from database that are PDFs
      const pdfFilesFromDb = dbFiles.filter(
        (file) => file.fileType === "application/pdf"
      );

      console.log("Found PDF files in database:", pdfFilesFromDb.length);

      // Check which ones have corresponding markdown files
      const pdfFilesWithStatus = await Promise.all(
        pdfFilesFromDb.map(async (file) => {
          // Check if markdown file exists by looking for it in markdown files
          const hasMarkdown = markdownFiles.some(
            (mdFile) =>
              mdFile.sourceFileName === file.fileName ||
              mdFile.fileName === file.fileName ||
              mdFile.sourceUrl === file.url
          );

          return {
            ...file,
            hasMarkdown,
            status: hasMarkdown ? "SUCCESS" : "PENDING",
          };
        })
      );

      setPdfFiles(pdfFilesWithStatus);
      console.log("Loaded PDF files with status:", pdfFilesWithStatus);
    } catch (error) {
      console.error("Error loading PDF files:", error);
      toast.error("Failed to load PDF files", {
        description: "Please try again or check your connection",
      });
    } finally {
      setIsLoadingPdfFiles(false);
      console.log("Finished loading PDF files");
    }
  };

  // Handle PDF parsing to generate markdown
  const handleParsePdf = async (pdfFile: any) => {
    try {
      setIsExtractingMarkdown(true);

      // Parse the PDF to generate markdown
      const result = await extractMarkdownOnly(pdfFile.url);

      if (result.success) {
        // Reload markdown files and PDF files to update status
        await loadMarkdownFiles();
        await loadPdfFiles();

        toast.success("PDF parsed successfully!", {
          description: "Markdown file has been generated",
        });
      } else {
        toast.error("Failed to parse PDF", {
          description: result.error || "Unknown error occurred",
        });
      }
    } catch (error) {
      toast.error("Failed to parse PDF", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsExtractingMarkdown(false);
    }
  };

  // Delete processed document
  const handleDeleteProcessedDocument = async (
    documentId: string,
    sourceUrl: string,
    documentTitle: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete "${documentTitle}"? This will permanently remove the document and all related chat history.`
      )
    ) {
      return;
    }

    try {
      const result = await deleteProcessedDocumentWithQdrant(
        documentId,
        sourceUrl
      );
      if (result.success) {
        // Reload processed documents and conversations
        await loadProcessedDocuments();
        await loadConversations();
        // Trigger refresh for Overview page
        setRefreshTrigger((prev) => prev + 1);
        toast.success("Document deleted successfully", {
          description: result.message,
        });
      } else {
        toast.error("Failed to delete document", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Failed to delete document", {
        description: "An unexpected error occurred",
      });
    }
  };

  // Load markdown files from Vercel Blob
  const loadMarkdownFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const result = await listMarkdownFiles();
      if (result.success) {
        setMarkdownFiles(result.files);
      } else {
        toast.error("Failed to load files", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Failed to load files", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Delete markdown file from Vercel Blob
  const handleDeleteMarkdownFile = async (url: string, fileName: string) => {
    try {
      const result = await deleteMarkdownFile(url);
      if (result.success) {
        setMarkdownFiles((prev) => prev.filter((file) => file.url !== url));

        // Delete related chat history
        const relatedConversations = conversations.filter(
          (conv) =>
            conv.documentTitle === fileName ||
            conv.documentTitle.includes(fileName.replace(".md", ""))
        );

        for (const conversation of relatedConversations) {
          try {
            await deleteProcessedDocumentWithQdrant(
              conversation.documentId,
              conversation.documentTitle
            );
            console.log(
              "Deleted chat history for conversation:",
              conversation.id
            );
          } catch (error) {
            console.error("Error deleting chat history:", error);
          }
        }

        // Reload conversations and trigger refresh
        await loadConversations();
        setRefreshTrigger((prev) => prev + 1);

        toast.success("File deleted successfully", {
          description: `${fileName} and related chat history have been removed`,
        });
      } else {
        toast.error("Failed to delete file", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Failed to delete file", {
        description: "An unexpected error occurred",
      });
    }
  };

  // Handle file preview
  const handlePreviewFile = async (file: MarkdownFile) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
    setIsLoadingPreview(true);

    try {
      const result = await getMarkdownContent(file.url);
      if (result.success) {
        setPreviewContent(result.content);
      } else {
        toast.error("Failed to load file content", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Failed to load file content", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Load processed documents for chat
  const loadProcessedDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      const result = await getDbProcessedDocuments();
      if (result.success) {
        setProcessedDocuments(result.processedDocuments || []);
      } else {
        toast.error("Failed to load documents", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Failed to load documents", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Handle chat message submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocument || !currentQuestion.trim() || isLoadingChat) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: currentQuestion,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setCurrentQuestion("");
    setIsLoadingChat(true);

    try {
      const result = await queryDocument(
        currentQuestion,
        selectedDocument.sourceUrl || selectedDocument.fileUrl,
        chatMessages
      );

      if (result.success && result.answer) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: result.answer,
          timestamp: new Date().toISOString(),
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setChatMessages(finalMessages);

        // Save or update conversation
        const conversationId = currentConversationId || `conv_${Date.now()}`;
        const isNewConversation = !currentConversationId;

        // Find the corresponding file in the database
        const correspondingFile = dbFiles.find(
          (file) =>
            file.sourceUrl ===
              (selectedDocument.sourceUrl || selectedDocument.fileUrl) ||
            file.url ===
              (selectedDocument.sourceUrl || selectedDocument.fileUrl) ||
            file.fileName === selectedDocument.fileName ||
            file.sourceFileName === selectedDocument.fileName
        );

        console.log("Looking for file with:", {
          sourceUrl: selectedDocument.sourceUrl || selectedDocument.fileUrl,
          fileName: selectedDocument.fileName,
        });
        console.log(
          "Available files:",
          dbFiles.map((f) => ({
            id: f.id,
            sourceUrl: f.sourceUrl,
            url: f.url,
            fileName: f.fileName,
            sourceFileName: f.sourceFileName,
          }))
        );
        console.log("Found corresponding file:", correspondingFile);

        const conversation: Conversation = {
          id: conversationId,
          title: isNewConversation
            ? generateConversationTitle(currentQuestion)
            : conversations.find((c) => c.id === conversationId)?.title ||
              generateConversationTitle(currentQuestion),
          documentId: selectedDocument.id,
          documentTitle:
            selectedDocument.sourceFileName || selectedDocument.fileName,
          messages: finalMessages,
          createdAt: isNewConversation
            ? new Date().toISOString()
            : conversations.find((c) => c.id === conversationId)?.createdAt ||
              new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Pass the fileId to saveConversation (null if no file found)
        await saveConversation(conversation, correspondingFile?.id || null);
        setCurrentConversationId(conversationId);
      } else {
        toast.error("Failed to get answer", {
          description: result.error || "Unknown error occurred",
        });
      }
    } catch (error) {
      toast.error("Failed to get answer", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Load files and conversations on component mount
  useEffect(() => {
    loadMarkdownFiles();
    loadConversations();
    loadDbFiles();
    loadDbProcessedDocuments();
  }, []);

  // Load PDF files when dbFiles or markdownFiles change
  useEffect(() => {
    if (dbFiles.length > 0) {
      loadPdfFiles();
    }
  }, [dbFiles, markdownFiles]);

  // Load processed documents when chat section is active
  useEffect(() => {
    if (activeSection === "chat") {
      loadProcessedDocuments();
    }
  }, [activeSection]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const chatMessagesContainer = document.getElementById("chat-messages");
    if (chatMessagesContainer) {
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <SidebarProvider>
      <SidebarLeft
        onSectionChange={setActiveSection}
        onFileSelect={setSelectedFile}
      />
      <SidebarInset>
        {/* Header */}
        <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Document Parser
              </h1>
            </div>
          </div>
          <div className="px-3">
            <ThemeButton />
          </div>
        </header>

        {/* Main Content */}
        <div
          className={`min-h-screen ${
            activeSection === "dashboard" ? "bg-background" : "bg-background"
          }`}
        >
          <div className="max-w-6xl mx-auto px-6 py-8">
            {activeSection === "dashboard" ? (
              <OverviewContent refreshTrigger={refreshTrigger} />
            ) : activeSection === "user-dashboard" ? (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold light:text-gray-900 dark:text-white mb-2">
                    Account
                  </h2>
                  <p className="text-lg light:text-gray-600 dark:text-gray-400">
                    Manage your profile and session
                  </p>
                </div>
                <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border light:border-gray-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="text-left">
                      <p className="text-xl font-semibold">
                        {session?.user?.name || "User"}
                      </p>
                      <p className="text-muted-foreground">
                        {session?.user?.email || ""}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => signOut({ callbackUrl: "/landing" })}
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            ) : activeSection === "files" ? (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold light:text-gray-900 dark:text-white mb-4">
                    Files & Documents
                  </h2>
                  <p className="text-lg light:text-gray-600 dark:text-gray-400">
                    Manage your processed documents and extracted markdown files
                  </p>
                  <p className="text-md light:text-gray-600 dark:text-gray-400">
                    Upload a file and click Extract Markdown to generate a
                    markdown file.
                  </p>
                </div>

                {/* Markdown Files Section */}
                {/* Markdown Files Section */}
                <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border light:border-gray-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold light:text-gray-900 dark:text-white">
                      Markdown Files
                    </h3>
                    <Button
                      onClick={loadMarkdownFiles}
                      disabled={isLoadingFiles}
                      variant="outline"
                      size="sm"
                    >
                      {isLoadingFiles ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      )}
                      <span className="ml-2">Refresh</span>
                    </Button>
                  </div>

                  {isLoadingFiles ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2 light:text-gray-600 dark:text-gray-400">
                        Loading files...
                      </span>
                    </div>
                  ) : markdownFiles.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium light:text-gray-900 dark:text-white mb-2">
                        No files yet
                      </h4>
                      <p className="light:text-gray-600 dark:text-gray-400">
                        Process some documents to see them here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {markdownFiles.map((file) => (
                        <div
                          key={file.url}
                          className="flex items-center justify-between p-4 light:bg-gray-50 dark:bg-slate-700 rounded-lg border light:border-gray-200 dark:border-slate-600 light:hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors cursor-pointer group"
                          onClick={() => handlePreviewFile(file)}
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-5 h-5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium light:text-gray-900 dark:text-white truncate">
                                  {file.sourceFileName || file.fileName}
                                </h4>
                                <svg
                                  className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </div>
                              <p className="text-sm light:text-gray-500 dark:text-gray-400 truncate">
                                {file.sourceUrl
                                  ? `From: ${file.sourceUrl}`
                                  : "Markdown file"}
                              </p>
                              <div className="flex items-center space-x-2 text-xs light:text-gray-600 dark:text-gray-400 mt-1">
                                <span>{(file.size / 1024).toFixed(1)} KB</span>
                                <span>•</span>
                                <span>
                                  {new Date(
                                    file.uploadedAt
                                  ).toLocaleDateString()}
                                </span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                  Success
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(file.downloadUrl, "_blank");
                              }}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <span className="ml-1">Download</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMarkdownFile(
                                  file.url,
                                  file.fileName
                                );
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              <span className="ml-1">Delete</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : activeSection === "pdf-files" ? (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold light:text-gray-900 dark:text-white mb-4">
                    PDF Files
                  </h2>
                  <p className="text-lg light:text-gray-600 dark:text-gray-400">
                    Manage your uploaded PDF files and their parsing status
                  </p>
                  <p className="text-md light:text-gray-600 dark:text-gray-400">
                    Upload PDF files and parse them to generate markdown files.
                  </p>
                </div>

                {/* PDF Files Section */}
                <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border light:border-gray-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold light:text-gray-900 dark:text-white">
                      PDF Files
                    </h3>
                    <Button
                      onClick={async () => {
                        try {
                          setIsLoadingPdfFiles(true);
                          // Refresh both database files and PDF files
                          await loadDbFiles();
                          await loadMarkdownFiles();
                          await loadPdfFiles();
                        } catch (error) {
                          console.error("Error refreshing files:", error);
                          toast.error("Failed to refresh files", {
                            description: "Please try again",
                          });
                        } finally {
                          setIsLoadingPdfFiles(false);
                        }
                      }}
                      disabled={isLoadingPdfFiles}
                      variant="outline"
                      size="sm"
                    >
                      {isLoadingPdfFiles ? (
                        <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin"></div>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      )}
                      <span className="ml-2">Refresh</span>
                    </Button>
                  </div>

                  {isLoadingPdfFiles ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin"></div>
                      <span className="ml-2 text-muted-foreground">
                        Loading PDF files...
                      </span>
                    </div>
                  ) : pdfFiles.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium light:text-gray-900 dark:text-white mb-2">
                        No PDF files yet
                      </h4>
                      <p className="light:text-gray-600 dark:text-gray-400">
                        Upload some PDF files to see them here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pdfFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-4 light:bg-gray-50 dark:bg-slate-700 rounded-lg border light:border-gray-200 dark:border-slate-600 light:hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-5 h-5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium light:text-gray-900 dark:text-white truncate">
                                  {file.fileName}
                                </h4>
                              </div>
                              <p className="text-sm light:text-gray-500 dark:text-gray-400 truncate">
                                PDF Document
                              </p>
                              <div className="flex items-center space-x-2 text-xs light:text-gray-600 dark:text-gray-400 mt-1">
                                <span>
                                  {file.size
                                    ? `${(file.size / 1024).toFixed(1)} KB`
                                    : "Unknown size"}
                                </span>
                                <span>•</span>
                                <span>
                                  {new Date(
                                    file.uploadedAt
                                  ).toLocaleDateString()}
                                </span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <div
                                    className={`w-2 h-2 rounded-full mr-1 ${
                                      file.status === "SUCCESS"
                                        ? "bg-green-500"
                                        : "bg-yellow-500"
                                    }`}
                                  ></div>
                                  {file.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {file.status === "SUCCESS" ? (
                              <div className="flex items-center space-x-2">
                                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                                  ✓ Markdown Generated
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    window.open(file.url, "_blank")
                                  }
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                  <span className="ml-1">View</span>
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleParsePdf(file)}
                                disabled={isExtractingMarkdown}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {isExtractingMarkdown ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                )}
                                <span className="ml-1">
                                  {isExtractingMarkdown
                                    ? "Parsing..."
                                    : "Parse"}
                                </span>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : activeSection === "chat" ? (
              <div className="h-[calc(100vh-8rem)] flex flex-col">
                <div className="text-center mb-6 flex-shrink-0">
                  <h2 className="text-3xl font-bold light:text-gray-900 dark:text-white mb-2">
                    Chat with Documents
                  </h2>
                  <p className="text-lg light:text-gray-600 dark:text-gray-400">
                    Ask questions about your processed documents using AI
                  </p>
                </div>

                {/* Responsive Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                  {/* Chat History - 25% on large screens, full width on mobile */}
                  <div className="col-span-1 lg:col-span-1 flex flex-col order-first mb-5 min-h-0">
                    <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border light:border-gray-200 dark:border-slate-700 flex flex-col h-full min-h-0">
                      {/* Conversation History Header */}
                      <div className="px-4 py-3 border-b light:border-gray-200 dark:border-slate-600 flex-shrink-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold light:text-gray-900 dark:text-white">
                            Chat History
                          </h3>
                          <Button
                            onClick={startNewConversation}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            New
                          </Button>
                        </div>
                      </div>

                      {/* Conversation List */}
                      <div className="flex-1 overflow-y-auto p-2">
                        {conversations.length === 0 ? (
                          <div className="p-3 text-center text-xs text-muted-foreground">
                            No conversations yet
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {conversations.map((conversation) => (
                              <div
                                key={conversation.id}
                                className={`p-2 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                                  currentConversationId === conversation.id
                                    ? "bg-accent border-primary"
                                    : "light:border-gray-200 dark:border-slate-600"
                                }`}
                                onClick={() =>
                                  loadConversation(conversation.id)
                                }
                              >
                                <p className="font-medium truncate text-xs">
                                  {conversation.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {conversation.documentTitle}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    conversation.updatedAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chat Interface - 50% on large screens, full width on mobile */}
                  <div className="col-span-1 lg:col-span-2 flex flex-col order-2 mb-5 min-h-0">
                    <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border light:border-gray-200 dark:border-slate-700 flex flex-col h-full min-h-0">
                      {/* Chat Header */}
                      <div className="px-6 py-4 border-b light:border-gray-200 dark:border-slate-600 flex-shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold light:text-gray-900 dark:text-white">
                                {selectedDocument
                                  ? selectedDocument.sourceFileName ||
                                    selectedDocument.fileName
                                  : "Select a Document"}
                              </h3>
                              <p className="text-sm light:text-gray-600 dark:text-gray-400">
                                {selectedDocument
                                  ? `${selectedDocument.chunkCount} chunks available`
                                  : "Choose a document to start chatting"}
                              </p>
                            </div>
                          </div>
                          {selectedDocument && (
                            <Button
                              onClick={startNewConversation}
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-2"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                              <span>New Chat</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div
                        id="chat-messages"
                        className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 min-h-0"
                      >
                        {!selectedDocument ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                  className="w-8 h-8 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </div>
                              <h4 className="text-lg font-medium light:text-gray-900 dark:text-white mb-2">
                                No Document Selected
                              </h4>
                              <p className="light:text-gray-600 dark:text-gray-400">
                                Select a document from the right panel to start
                                asking questions
                              </p>
                            </div>
                          </div>
                        ) : chatMessages.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                              </div>
                              <h4 className="text-lg font-medium light:text-gray-900 dark:text-white mb-2">
                                Ready to Chat!
                              </h4>
                              <p className="light:text-gray-600 dark:text-gray-400">
                                Ask any question about "
                                {selectedDocument.sourceFileName ||
                                  selectedDocument.fileName}
                                "
                              </p>
                            </div>
                          </div>
                        ) : (
                          chatMessages.map((message, index) => (
                            <div
                              key={index}
                              className={`flex ${
                                message.role === "user"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 py-2 sm:px-4 sm:py-3 ${
                                  message.role === "user"
                                    ? "bg-blue-500 text-white"
                                    : "light:bg-gray-100 dark:bg-slate-700 light:text-gray-900 dark:text-white"
                                }`}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {message.content}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${
                                    message.role === "user"
                                      ? "text-blue-100"
                                      : "light:text-gray-500 dark:text-gray-400"
                                  }`}
                                >
                                  {new Date(
                                    message.timestamp
                                  ).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))
                        )}

                        {isLoadingChat && (
                          <div className="flex justify-start">
                            <div className="light:bg-gray-100 dark:bg-slate-700 rounded-lg px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat Input */}
                      {selectedDocument && (
                        <div className="p-4 lg:p-6 border-t light:border-gray-200 dark:border-slate-600 flex-shrink-0">
                          <form
                            onSubmit={handleChatSubmit}
                            className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3"
                          >
                            <input
                              type="text"
                              value={currentQuestion}
                              onChange={(e) =>
                                setCurrentQuestion(e.target.value)
                              }
                              placeholder="Ask a question about this document..."
                              className="flex-1 px-4 py-3 light:bg-gray-50 dark:bg-slate-700 border light:border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 light:text-gray-900 dark:text-white placeholder-gray-500"
                              disabled={isLoadingChat}
                            />
                            <Button
                              type="submit"
                              disabled={
                                !currentQuestion.trim() || isLoadingChat
                              }
                              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                            >
                              {isLoadingChat ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                    />
                                  </svg>
                                  <span className="hidden sm:inline">Send</span>
                                </div>
                              )}
                            </Button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document List - 25% on large screens, full width on mobile */}
                  <div className="col-span-1 lg:col-span-1 flex flex-col order-last mb-5 min-h-0">
                    <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border light:border-gray-200 dark:border-slate-700 flex flex-col h-full min-h-0">
                      {/* Document List Header */}
                      <div className="px-6 py-4 border-b light:border-gray-200 dark:border-slate-600 flex-shrink-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold light:text-gray-900 dark:text-white">
                            Processed Documents
                          </h3>
                          <Button
                            onClick={loadProcessedDocuments}
                            disabled={isLoadingDocuments}
                            variant="outline"
                            size="sm"
                          >
                            {isLoadingDocuments ? (
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Document List */}
                      <div className="flex-1 overflow-y-auto p-3 lg:p-4">
                        {isLoadingDocuments ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-2 light:text-gray-600 dark:text-gray-400">
                              Loading documents...
                            </span>
                          </div>
                        ) : processedDocuments.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <h4 className="text-sm font-medium light:text-gray-900 dark:text-white mb-2">
                              No documents yet
                            </h4>
                            <p className="text-xs light:text-gray-600 dark:text-gray-400">
                              Process documents using "Ask Questions on
                              Document" to see them here
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {processedDocuments.map((doc) => (
                              <div
                                key={doc.id}
                                className={`p-3 rounded-lg border transition-all duration-200 ${
                                  selectedDocument?.id === doc.id
                                    ? "border-blue-500 light:bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-slate-600 light:bg-gray-50 dark:bg-slate-700"
                                }`}
                              >
                                <div className="flex items-start space-x-3">
                                  <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      setChatMessages([]);
                                    }}
                                  >
                                    <div className="flex items-start space-x-3">
                                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg
                                          className="w-4 h-4 text-white"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                          />
                                        </svg>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium light:text-gray-900 dark:text-white truncate">
                                          {doc.sourceFileName || doc.fileName}
                                        </h4>
                                        <p className="text-xs light:text-gray-500 dark:text-gray-400 truncate">
                                          {doc.chunkCount} chunks
                                        </p>
                                        <p className="text-xs light:text-gray-400 dark:text-gray-500">
                                          {new Date(
                                            doc.processedAt
                                          ).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteProcessedDocument(
                                        doc.id,
                                        doc.sourceUrl || doc.fileUrl,
                                        doc.sourceFileName || doc.fileName
                                      );
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Conversation History - 15% on large screens, full width on mobile */}
                </div>
              </div>
            ) : (
              <>
                {/* Hero Section */}
                <div className="text-center mb-12 ">
                  <h2 className="text-4xl font-bold light:text-gray-900 dark:text-white mb-4">
                    Extract Text from PDF Documents
                  </h2>
                  <p className="text-xl light:text-gray-600  dark:text-white mb-8 max-w-2xl mx-auto">
                    Upload or provide a URL to any PDF document and extract its
                    text content instantly with our powerful parsing engine.
                  </p>

                  {/* Upload Card */}
                  <div className="max-w-lg mx-auto mb-12">
                    <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border light:border-gray-200 dark:border-slate-700 p-8">
                      <div className="mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0l-4 4m4-4l4 4"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold light:text-gray-900 dark:text-white mb-2 text-center">
                          Upload a PDF
                        </h3>
                        <p className="text-sm light:text-gray-600 dark:text-gray-400 text-center">
                          Select a PDF file to upload to Vercel Blob
                        </p>
                      </div>

                      <div className="space-y-4">
                        <input
                          type="file"
                          id="file-upload"
                          accept="application/pdf"
                          className="block w-full text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-700 dark:file:text-slate-100"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.type !== "application/pdf") {
                              toast.error("Invalid file type", {
                                description: "Please select a PDF file",
                                duration: 3000,
                              });
                              e.target.value = "";
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={async () => {
                            const fileInput = document.getElementById(
                              "file-upload"
                            ) as HTMLInputElement;
                            const file = fileInput?.files?.[0];

                            if (!file) {
                              toast.error("No file selected", {
                                description:
                                  "Please select a PDF file to upload",
                                duration: 3000,
                              });
                              return;
                            }

                            if (file.type !== "application/pdf") {
                              toast.error("Invalid file type", {
                                description: "Please select a PDF file",
                                duration: 3000,
                              });
                              return;
                            }

                            console.log(
                              "Starting upload, setting loading to true"
                            );
                            setIsUploading(true);
                            setResult(null);
                            setUploadedUrl(null);
                            setExtractedMarkdown(null);

                            try {
                              const uploadRes = await uploadPdfToBlob(file);
                              if (!uploadRes.success) {
                                throw new Error(
                                  uploadRes.error || "Upload failed"
                                );
                              }
                              setUploadedUrl(uploadRes.url);

                              // Save file to database
                              const fileId = `file_${Date.now()}`;
                              await createFile({
                                id: fileId,
                                url: uploadRes.url,
                                fileName: file.name.replace(".pdf", ""),
                                fileType: "application/pdf",
                                pageCount: (uploadRes as any).pageCount || 0,
                                size: file.size,
                              });

                              // Reload database files
                              await loadDbFiles();
                              // Trigger refresh for Overview page
                              setRefreshTrigger((prev) => prev + 1);

                              toast.success("PDF uploaded successfully!", {
                                description:
                                  "Your file is ready for processing",
                                duration: 3000,
                              });
                            } catch (e) {
                              const errorMessage =
                                e instanceof Error
                                  ? e.message
                                  : "Unknown error";
                              setResult({
                                success: false,
                                error: errorMessage,
                              });
                              toast.error("Upload failed", {
                                description: errorMessage,
                                duration: 4000,
                              });
                            } finally {
                              console.log(
                                "Upload finished, setting loading to false"
                              );
                              setIsUploading(false);
                            }
                          }}
                          disabled={isUploading}
                          size="lg"
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploading ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0l-4 4m4-4l4 4"
                                />
                              </svg>
                              <span>Upload PDF</span>
                            </div>
                          )}
                        </Button>
                        {uploadedUrl && (
                          <p className="mt-3 text-xs light:text-gray-600 dark:text-gray-400 break-all text-center">
                            Uploaded to: {uploadedUrl}
                          </p>
                        )}
                        {/* Debug loading state */}
                        <p className="mt-2 text-xs text-gray-500 text-center">
                          Debug: isUploading = {isUploading ? "true" : "false"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Processing Functions - Only show after upload */}
                  {uploadedUrl && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                      {/* Function 2: Extract Markdown */}
                      <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border light:border-gray-200 dark:border-slate-700 p-6">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold light:text-gray-900 dark:text-white">
                              Extract Markdown
                            </h3>
                            <p className="text-sm light:text-gray-600 dark:text-gray-400">
                              Extract text from PDF, convert to markdown, and
                              save to cloud storage
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={async () => {
                            setIsExtractingMarkdown(true);
                            setResult(null);
                            setExtractedMarkdown(null);
                            try {
                              const extractRes = await extractMarkdownOnly(
                                uploadedUrl
                              );
                              setResult(extractRes);
                              if (extractRes.success) {
                                setExtractedMarkdown(extractRes.text || "");

                                // Update the existing PDF file with page count
                                // Find the PDF file that was uploaded
                                const existingPdfFile = dbFiles.find(
                                  (file) =>
                                    file.url === uploadedUrl &&
                                    file.fileType === "application/pdf"
                                );

                                if (existingPdfFile) {
                                  await updateFile(existingPdfFile.id, {
                                    pageCount:
                                      (extractRes as any).pageCount || 0,
                                    sourceFileName: extractRes.sourceFileName,
                                  });
                                }

                                // Reload database files
                                await loadDbFiles();

                                toast.success("Markdown extracted and saved!", {
                                  description:
                                    "Markdown file has been saved to Vercel Blob",
                                  duration: 3000,
                                });
                                // Refresh the markdown files list
                                loadMarkdownFiles();
                              } else {
                                toast.error("Extraction failed", {
                                  description:
                                    extractRes.error ||
                                    "Failed to extract markdown",
                                  duration: 4000,
                                });
                              }
                            } finally {
                              setIsExtractingMarkdown(false);
                            }
                          }}
                          disabled={isExtractingMarkdown || isStoring}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isExtractingMarkdown ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Extracting...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <span>Extract Markdown</span>
                            </div>
                          )}
                        </Button>
                      </div>

                      {/* Function 3: Extract & Store in Qdrant */}
                      <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border light:border-gray-200 dark:border-slate-700 p-6">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold light:text-gray-900 dark:text-white">
                              Ask Questions on Document
                            </h3>
                            <p className="text-sm light:text-gray-600 dark:text-gray-400">
                              Process your document and enable intelligent
                              question-answering
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={async () => {
                            setIsStoring(true);
                            setResult(null);
                            setExtractedMarkdown(null);
                            try {
                              const processRes = await processDocumentForQdrant(
                                uploadedUrl
                              );
                              if (processRes.success) {
                                setResult({
                                  success: true,
                                  text: `Document successfully processed and ready for questions!\n\n${processRes.message}\n\nYou can now go to the "Chat with Docs" section to ask questions about this document.`,
                                  sourceUrl: uploadedUrl,
                                  extractionDate: processRes.processingDate,
                                });

                                // Update the existing PDF file with page count if not already set
                                const existingPdfFile = dbFiles.find(
                                  (file) =>
                                    file.url === uploadedUrl &&
                                    file.fileType === "application/pdf"
                                );

                                if (
                                  existingPdfFile &&
                                  !existingPdfFile.pageCount
                                ) {
                                  await updateFile(existingPdfFile.id, {
                                    pageCount:
                                      (processRes as any).pageCount || 0,
                                  });
                                }

                                // Save processed document to database
                                const processedDocId = `processed_${Date.now()}`;
                                await createProcessedDocument({
                                  id: processedDocId,
                                  fileName:
                                    existingPdfFile?.fileName || "document",
                                  fileUrl: uploadedUrl,
                                  chunkCount: processRes.points || 0,
                                  pageCount: (processRes as any).pageCount || 0,
                                  sourceUrl: uploadedUrl,
                                });

                                // Reload processed documents and files
                                await loadDbProcessedDocuments();
                                await loadDbFiles();
                                // Trigger refresh for Overview page
                                setRefreshTrigger((prev) => prev + 1);

                                toast.success("Document ready for questions!", {
                                  description:
                                    "Go to Chat with Docs section to ask questions",
                                  duration: 4000,
                                });
                              } else {
                                setResult({
                                  success: false,
                                  error: processRes.error,
                                });
                                toast.error("Processing failed", {
                                  description:
                                    processRes.error ||
                                    "Failed to process document",
                                  duration: 4000,
                                });
                              }
                            } finally {
                              setIsStoring(false);
                            }
                          }}
                          disabled={isExtracting || isStoring}
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isStoring ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Processing...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                                />
                              </svg>
                              <span>Ask Questions on Document</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* PDF Download for Function 2 */}
                {extractedMarkdown && (
                  <div className="mt-6">
                    <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border light:border-gray-200 dark:border-slate-700 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold light:text-gray-900 dark:text-white">
                            Download Extracted Markdown
                          </h3>
                          <p className="text-sm light:text-gray-600 dark:text-gray-400">
                            Download the extracted markdown as a PDF file
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={async () => {
                            try {
                              const { jsPDF } = await import("jspdf");
                              const doc = new jsPDF();
                              const lineHeight = 7;
                              const margin = 10;
                              const pageWidth =
                                doc.internal.pageSize.getWidth() - margin * 2;
                              const textLines = doc.splitTextToSize(
                                extractedMarkdown,
                                pageWidth
                              );
                              let cursor = margin;
                              textLines.forEach((line: string) => {
                                if (
                                  cursor >
                                  doc.internal.pageSize.getHeight() - margin
                                ) {
                                  doc.addPage();
                                  cursor = margin;
                                }
                                doc.text(line, margin, cursor);
                                cursor += lineHeight;
                              });
                              doc.save("extracted.pdf");
                              toast.success("PDF downloaded!", {
                                description:
                                  "The extracted markdown has been saved as PDF",
                                duration: 3000,
                              });
                            } catch (error) {
                              toast.error("Download failed", {
                                description: "Failed to generate PDF file",
                                duration: 4000,
                              });
                            }
                          }}
                        >
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results Section - Only show when NOT in dashboard */}
                {result && (
                  <div className="mt-12">
                    {result.success ? (
                      <div className="space-y-6">
                        {/* <div className="light:bg-gradient-to-r light:from-green-50 light:to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-lg">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-6 h-6 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                                Document Parsed Successfully!
                              </h2>
                              <div className="space-y-1 text-sm">
                                <p className="text-green-700 dark:text-green-300">
                                  <span className="font-medium">File:</span>{" "}
                                  {result.fileName}
                                </p>
                                <p className="text-green-700 dark:text-green-300">
                                  <span className="font-medium">
                                    Extracted on:
                                  </span>{" "}
                                  {new Date(
                                    result.extractionDate || ""
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div> */}

                        {/* Result Display */}
                        <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border light:border-gray-200 dark:border-slate-700 overflow-hidden">
                          <div className="light:bg-gradient-to-r light:from-slate-50 light:to-gray-50 dark:from-slate-700 dark:to-slate-600 px-6 py-4 border-b light:border-gray-200 dark:border-slate-600">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold light:text-gray-900 dark:text-white">
                                  {result.text?.includes(
                                    "Document successfully processed and ready for questions"
                                  )
                                    ? "Document Ready for Questions"
                                    : "Extracted Content"}
                                </h3>
                                {result.sourceUrl && (
                                  <p className="text-sm light:text-gray-600 dark:text-gray-400">
                                    Source: {result.sourceUrl}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="p-6">
                            {result.text?.includes(
                              "Document successfully processed and ready for questions"
                            ) ? (
                              <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <svg
                                    className="w-8 h-8 text-green-600 dark:text-green-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                                <h4 className="text-xl font-semibold light:text-gray-900 dark:text-white mb-4">
                                  Document Successfully Processed!
                                </h4>
                                <p className="light:text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                                  Your document has been processed and is now
                                  ready for question-answering. You can ask
                                  questions about this document in the Chat with
                                  Docs section.
                                </p>
                                {/* <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                    {result.text.split("\n\n")[1]}
                                  </p>
                                </div> */}
                                <Button
                                  onClick={() => setActiveSection("chat")}
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200"
                                >
                                  <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                  </svg>
                                  Go to Chat with Docs
                                </Button>
                              </div>
                            ) : (
                              <div className="light:bg-slate-50 dark:bg-slate-900 rounded-lg border light:border-gray-200 dark:border-slate-600 overflow-hidden">
                                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono light:text-gray-800 dark:text-gray-200 p-4 overflow-auto max-h-96">
                                  {result.text}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
                              Parsing Failed
                            </h2>
                            <p className="text-red-700 dark:text-red-300">
                              {result.error}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SidebarInset>

      {/* Preview Sheet */}
      <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {previewFile
                ? previewFile.sourceFileName || previewFile.fileName
                : "File Preview"}
            </SheetTitle>
            <SheetDescription>
              {previewFile?.sourceUrl && `Source: ${previewFile.sourceUrl}`}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 h-full">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Loading content...
                </span>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-auto">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap text-sm light:bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-100">
                      {previewContent}
                    </pre>
                  </div>
                </div>

                {previewFile && (
                  <div className="mt-4 pt-4 border-t light:border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Size: {(previewFile.size / 1024).toFixed(1)} KB</p>
                        <p>
                          Created:{" "}
                          {new Date(previewFile.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            window.open(previewFile.downloadUrl, "_blank")
                          }
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (previewFile) {
                              handleDeleteMarkdownFile(
                                previewFile.url,
                                previewFile.fileName
                              );
                              setIsPreviewOpen(false);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
}
