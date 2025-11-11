"use client";

import { extractMarkdownOnly } from "@/actions/extractMarkdownOnly";
import { processDocumentForQdrant } from "@/actions/processDocumentForQdrant";
import { ThemeButton } from "@/components/theme-button";
import { Button } from "@/components/ui/button";
import { SidebarLeft } from "@/components/sidebar-left";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

import { useState, useEffect } from "react";
import { uploadPdfToBlob } from "@/actions/uploadPdfToBlob";
import { listMarkdownFiles } from "@/actions/listMarkdownFiles";

import { queryDocument, ChatMessage } from "@/actions/queryDocument";
import { createFile, getFiles, updateFile } from "@/actions/db-files";

import {
  createProcessedDocument,
  getProcessedDocuments as getDbProcessedDocuments,
} from "@/actions/db-processed-documents";

export interface Conversation {
  id: string;
  title: string;
  documentId: string;
  documentTitle: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
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

  const loadPdfFiles = async () => {
    console.log("Starting to load PDF files...");
    setIsLoadingPdfFiles(true);
    try {
      console.log("Current dbFiles:", dbFiles.length);
      console.log("Current markdownFiles:", markdownFiles.length);

      const pdfFilesFromDb = dbFiles.filter(
        (file) => file.fileType === "application/pdf"
      );

      console.log("Found PDF files in database:", pdfFilesFromDb.length);

      const pdfFilesWithStatus = await Promise.all(
        pdfFilesFromDb.map(async (file) => {
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

  useEffect(() => {
    loadMarkdownFiles();
    loadDbFiles();
    loadDbProcessedDocuments();
  }, []);

  useEffect(() => {
    if (dbFiles.length > 0) {
      loadPdfFiles();
    }
  }, [dbFiles, markdownFiles]);

  useEffect(() => {
    if (activeSection === "chat") {
      loadProcessedDocuments();
    }
  }, [activeSection]);

  useEffect(() => {
    const chatMessagesContainer = document.getElementById("chat-messages");
    if (chatMessagesContainer) {
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <>
      <div>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <>
            {/* Hero Section */}
            <div className="text-center mb-12 ">
              <h2 className="text-4xl font-bold light:text-gray-900 dark:text-white mb-4">
                Extract Text from PDF Documents
              </h2>
              <p className="text-xl light:text-gray-600  dark:text-white mb-8 max-w-2xl mx-auto">
                Upload or provide a URL to any PDF document and extract its text
                content instantly with our powerful parsing engine.
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
                            description: "Please select a PDF file to upload",
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

                        console.log("Starting upload, setting loading to true");
                        setIsUploading(true);
                        setResult(null);
                        setUploadedUrl(null);
                        setExtractedMarkdown(null);

                        try {
                          const uploadRes = await uploadPdfToBlob(file);
                          if (!uploadRes.success) {
                            throw new Error(uploadRes.error || "Upload failed");
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
                            description: "Your file is ready for processing",
                            duration: 3000,
                          });
                        } catch (e) {
                          const errorMessage =
                            e instanceof Error ? e.message : "Unknown error";
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
                          Extract text from PDF, convert to markdown, and save
                          to cloud storage
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
                                pageCount: (extractRes as any).pageCount || 0,
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

                            if (existingPdfFile && !existingPdfFile.pageCount) {
                              await updateFile(existingPdfFile.id, {
                                pageCount: (processRes as any).pageCount || 0,
                              });
                            }

                            // Save processed document to database
                            const processedDocId = `processed_${Date.now()}`;
                            await createProcessedDocument({
                              id: processedDocId,
                              fileName: existingPdfFile?.fileName || "document",
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
                              Your document has been processed and is now ready
                              for question-answering. You can ask questions
                              about this document in the Chat with Docs section.
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
        </div>
      </div>
    </>
  );
}
