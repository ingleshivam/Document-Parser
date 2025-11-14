"use client";
import { getConversations } from "@/actions/db-conversations";
import { deleteMarkdownFile } from "@/actions/deleteMarkdownFile";
import { deleteProcessedDocumentWithQdrant } from "@/actions/deleteProcessedDocumentWithQdrant";
import { getMarkdownContent } from "@/actions/getMarkdownContent";
import { listMarkdownFiles } from "@/actions/listMarkdownFiles";
import { ChatMessage } from "@/actions/queryDocument";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createProcessedDocument,
  getProcessedDocuments as getDbProcessedDocuments,
} from "@/actions/db-processed-documents";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CircleCheckBig, FileInput, FileQuestionMark } from "lucide-react";
import { storeMarkdownInQdrant } from "@/actions/storeMarkdownInQdrant";
import { getFiles } from "@/actions/db-files";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MarkdownFile {
  url: string;
  fileName: string;
  size: number;
  uploadedAt: string;
  downloadUrl: string;
  sourceUrl?: string;
  sourceFileName?: string;
}

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

export default function Files() {
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [markdownFiles, setMarkdownFiles] = useState<MarkdownFile[]>([]);
  const [previewFile, setPreviewFile] = useState<MarkdownFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [dbProcessedDocuments, setDbProcessedDocuments] = useState<
    DbProcessedDocument[]
  >([]);
  const [isFileProcessingForQdrant, setIsFileProcessingForQdrant] =
    useState(false);
  const [dbFiles, setDbFiles] = useState<any[]>([]);
  const [processingFileUrl, setProcessingFileUrl] = useState<string | null>(
    null
  );

  console.log("dbFiles : ", dbFiles);
  console.log("markdownFiles : ", markdownFiles);

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

  const processFile = async (fileUrl: string, sourceUrl: string) => {
    try {
      // mark this file as processing (per-file)
      setProcessingFileUrl(fileUrl);
      setIsFileProcessingForQdrant(true); // optional if you still need global flag elsewhere

      const response = await fetch(fileUrl);
      const textcontent = await response.text();
      const processRes = await storeMarkdownInQdrant({
        markdown: textcontent,
        sourceUrl: fileUrl,
      });

      if (processRes.success) {
        const existingPdfFile = dbFiles.find((file) => file.url === sourceUrl);
        const processedDocId = `processed_${Date.now()}`;

        const processDocResult = await createProcessedDocument({
          id: processedDocId,
          fileName: existingPdfFile?.fileName,
          fileUrl: fileUrl,
          chunkCount: processRes.points || 0,
          pageCount: existingPdfFile?.pageCount || 0,
          sourceUrl: fileUrl,
        });

        if (processDocResult.success) {
          toast.success("Document ready for questions!", {
            description: "Go to Chat with Docs section to ask questions",
            duration: 4000,
          });
          // refresh lists
          await loadMarkdownFiles();
          await loadDbProcessedDocuments();
        } else {
          console.error(
            "Error creating processed doc:",
            processDocResult.error
          );
          toast.error("Failed to register processed document");
        }
      } else {
        console.error("Error storing markdown in Qdrant:", processRes.error);
        toast.error("Failed to process document");
      }
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error("Unexpected error while processing file");
    } finally {
      setIsFileProcessingForQdrant(false);
      setProcessingFileUrl(null);
    }
  };

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

  const isFileProcessed = (fileUrl: string) => {
    const processedDoc = dbProcessedDocuments.find(
      (doc) => doc.fileUrl === fileUrl
    );
    if (processedDoc) {
      return true;
    } else {
      return false;
    }
  };

  useEffect(() => {
    loadMarkdownFiles();
    loadConversations();
    loadDbFiles();
    loadDbProcessedDocuments();
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="text-center mb-8 py-8">
          <h2 className="text-3xl font-bold light:text-gray-900 dark:text-white mb-4">
            Files & Documents
          </h2>
          <p className="text-lg light:text-gray-600 dark:text-gray-400">
            Manage your processed documents and extracted markdown files
          </p>
          <p className="text-md light:text-gray-600 dark:text-gray-400">
            Upload a file and click Extract Markdown to generate a markdown
            file.
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
                          File Name : {file.sourceFileName || file.fileName}
                        </h4>
                        <p>{}</p>
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
                      {/* <p className="text-sm light:text-gray-500 dark:text-gray-400 truncate">
                        {file.sourceUrl
                          ? `From: ${file.sourceUrl}`
                          : "Markdown file"}
                      </p> */}
                      <div className="flex items-center space-x-2 text-xs light:text-gray-600 dark:text-gray-400 mt-1">
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>
                          {new Date(file.uploadedAt).toLocaleDateString()}
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
                        handleDeleteMarkdownFile(file.url, file.fileName);
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline" // keep a valid variant
                          // style the processed state with Tailwind classes
                          className={
                            isFileProcessed(file.url)
                              ? "text-green-600 bg-green-50 hover:bg-green-100"
                              : ""
                          }
                          // only disable when this specific file is being processed
                          disabled={processingFileUrl === file.url}
                          onClick={(e) => {
                            e.stopPropagation();
                            // guard: don't re-process if already processing
                            if (
                              processingFileUrl === file.url ||
                              isFileProcessed(file.url)
                            )
                              return;
                            processFile(file.url, file.sourceUrl ?? "");
                          }}
                          aria-label={
                            processingFileUrl === file.url
                              ? `Processing ${
                                  file.sourceFileName ?? file.fileName
                                }`
                              : isFileProcessed(file.url)
                              ? `${
                                  file.sourceFileName ?? file.fileName
                                } processed`
                              : `Process ${
                                  file.sourceFileName ?? file.fileName
                                }`
                          }
                          title={
                            processingFileUrl === file.url
                              ? "Processing..."
                              : isFileProcessed(file.url)
                              ? "Processed"
                              : "Process file"
                          }
                        >
                          {processingFileUrl === file.url ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin inline-block" />
                              <span>Processing…</span>
                            </span>
                          ) : isFileProcessed(file.url) ? (
                            <span className="flex items-center gap-2">
                              <CircleCheckBig className="inline-block" />
                              <span>Processed</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <FileInput className="inline-block" />
                              <span>Process</span>
                            </span>
                          )}
                        </Button>
                      </TooltipTrigger>

                      {/* TooltipContent appears on hover — adjust text + color when processed */}
                      <TooltipContent side="top">
                        {processingFileUrl === file.url ? (
                          <div className="text-sm">
                            Processing file — please wait…
                          </div>
                        ) : isFileProcessed(file.url) ? (
                          <div className="text-sm">
                            ✔ File is ready to ask questions!
                          </div>
                        ) : (
                          <div className="text-sm">
                            Click to process this file.
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {previewFile
                ? previewFile.sourceFileName || previewFile.fileName
                : "File Preview"}
            </SheetTitle>
            <SheetDescription>
              {/* {previewFile?.sourceUrl && `Source: ${previewFile.sourceUrl}`} */}
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
    </>
  );
}
