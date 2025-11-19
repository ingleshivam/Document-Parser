"use client";

import {
  createConversation,
  getConversations,
  updateConversation,
} from "@/actions/db-conversations";
import {
  createMessage,
  getMessagesByConversationId,
} from "@/actions/db-messages";
import { deleteProcessedDocumentWithQdrant } from "@/actions/deleteProcessedDocumentWithQdrant";
import { ChatMessage, queryDocument } from "@/actions/queryDocument";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createProcessedDocument,
  getProcessedDocuments as getDbProcessedDocuments,
} from "@/actions/db-processed-documents";
import { getFiles } from "@/actions/db-files";
import { FileInput, Files, MessageSquare } from "lucide-react";
import ConfirmBox from "@/components/confirm-box";

export interface Conversation {
  id: string;
  title: string;
  documentId: string;
  documentTitle: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  processed_docs?: any;
}

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

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  console.log("conversations : ", conversations);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [selectedDocument, setSelectedDocument] =
    useState<DbProcessedDocument | null>(null);
  console.log("Selected Documented ;", selectedDocument);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [processedDocuments, setProcessedDocuments] = useState<
    DbProcessedDocument[]
  >([]);
  console.log("1processedDocuments : ", processedDocuments);
  const [dbProcessedDocuments, setDbProcessedDocuments] = useState<
    DbProcessedDocument[]
  >([]);
  const [dbFiles, setDbFiles] = useState<any[]>([]);
  console.log("1dbFiles : ", dbFiles);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
            fileUrl: conversation.processed_docs.fileUrl,
            sourceUrl: conversation.processed_docs.sourceUrl,
            processedAt: new Date(),
            chunkCount: conversation.processed_docs.chunkCount || 0,
          });
        }

        // Switch to chat section
        // setActiveSection("chat");
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

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

  const generateConversationTitle = (question: string): string => {
    // Take first 50 characters and add ellipsis if longer
    const maxLength = 50;
    if (question.length <= maxLength) {
      return question;
    }
    return question.substring(0, maxLength).trim() + "...";
  };

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
        const processedFile = processedDocuments.find(
          (file) =>
            file.sourceUrl ===
              (selectedDocument.sourceUrl || selectedDocument.fileUrl) ||
            file.fileUrl ===
              (selectedDocument.sourceUrl || selectedDocument.fileUrl) ||
            file.fileName === selectedDocument.fileName ||
            file.sourceFileName === selectedDocument.fileName
        );

        const mainFile = dbFiles.find(
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
        console.log("Found main file:", mainFile);
        console.log("Found processed file:", processedFile);

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

        await saveConversation(
          conversation,
          mainFile?.id || null,
          processedFile?.id || null
        );
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

  const saveConversation = async (
    conversation: Conversation,
    fileId?: string | null,
    processedFileId?: string | null
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

      const existingConversation = conversations.find(
        (c) => c.id === conversation.id
      );

      if (existingConversation) {
        console.log("Updating existing conversation");

        await updateConversation(conversation.id, {
          title: conversation.title,
          fileId: fileId || undefined,
          processedFileId: processedFileId || undefined,
        });
      } else {
        console.log("Creating new conversation");
        // Create new conversation
        const convResult = await createConversation({
          id: conversation.id,
          title: conversation.title,
          fileId: fileId || undefined,
          processedFileId: processedFileId || undefined,
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

      let savedCount = 0;
      for (let i = 0; i < conversation.messages.length; i++) {
        const message = conversation.messages[i];
        console.log("Message : ", message);
        const safeTimestamp = String(message.timestamp).replace(/[:.]/g, "_");

        const messageId = `${conversation.id}_${i}_${safeTimestamp}`;

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

  const loadConversations = async () => {
    setIsLoadingConversations(true);
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
            processed_docs: conv.processed_documents,
            documentTitle: (() => {
              // if (conv.files?.sourceFileName) return covnesatio .files.sourceFileName;
              if (conv.files?.fileName) return conv.files.fileName;

              if (conv.fileId) {
                const processedDoc = dbProcessedDocuments.find(
                  (doc) => doc.id === conv.fileId
                );
                if (processedDoc?.fileName) return processedDoc.fileName;
              }

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
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setChatMessages([]);
    setSelectedDocument(null);
  };

  useEffect(() => {
    loadConversations();
    loadProcessedDocuments();
    loadDbProcessedDocuments();
    loadDbFiles();
  }, []);

  const handleRefresh = async (data: { status: boolean; message: string }) => {
    if (data.status) {
      await loadProcessedDocuments();
      await loadConversations();
      setSelectedDocument(null);

      setRefreshTrigger((prev) => prev + 1);

      toast.success("Document deleted successfully", {
        description: data.message,
      });
    }
  };

  return (
    <>
      <div className="h-[calc(100vh-8rem)] flex flex-col ">
        <div className="text-center mb-6 flex-shrink-0 py-8">
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
              <div className="px-4 py-[24px] border-b light:border-gray-200 dark:border-slate-600 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold light:text-gray-900 dark:text-white">
                    Chat History
                  </h3>
                  <Button
                    onClick={startNewConversation}
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs"
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
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 light:text-gray-600 dark:text-gray-400">
                      Loading Conversations...
                    </span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex items-center text-center h-full">
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                        <MessageSquare />
                      </div>
                      <h4 className="text-sm font-medium light:text-gray-900 dark:text-white">
                        No Conversations Yet
                      </h4>
                      <p className="text-xs light:text-gray-600 dark:text-gray-400">
                        Start a new chat to see your conversations here.
                      </p>
                    </div>
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
                        onClick={() => loadConversation(conversation.id)}
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
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                        <FileInput />
                      </div>
                      <h4 className="text-sm font-medium light:text-gray-900 dark:text-white">
                        No Document Selected
                      </h4>
                      <p className="text-xs light:text-gray-600 dark:text-gray-400">
                        Select a document from the right panel to start asking
                        questions
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
                          {new Date(message.timestamp).toLocaleTimeString()}
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
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      placeholder="Ask a question about this document..."
                      className="flex-1 px-4 py-3 light:bg-gray-50 dark:bg-slate-700 border light:border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 light:text-gray-900 dark:text-white placeholder-gray-500"
                      disabled={isLoadingChat}
                    />
                    <Button
                      type="submit"
                      disabled={!currentQuestion.trim() || isLoadingChat}
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
              <div className="px-6 py-[24px] border-b light:border-gray-200 dark:border-slate-600 flex-shrink-0">
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
                  <div className="flex items-center text-center h-full">
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                        <Files />
                      </div>
                      <h4 className="text-sm font-medium light:text-gray-900 dark:text-white">
                        No Documents Yet
                      </h4>
                      <p className="text-xs light:text-gray-600 dark:text-gray-400">
                        Process documents using "Ask Questions on Document" to
                        see them here
                      </p>
                    </div>
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

                          <ConfirmBox
                            docId={doc.id}
                            sourceUrl={doc.sourceUrl || doc.fileUrl}
                            sourceFileName={doc.sourceFileName || doc.fileName}
                            onComplete={handleRefresh}
                          />
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
    </>
  );
}
