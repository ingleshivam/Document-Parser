"use client";

import { parseDocumentFromUrl } from "@/actions/parseDocumentFromUrl";
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
import { useState } from "react";
import { uploadPdfToBlob } from "@/actions/uploadPdfToBlob";
import { storeMarkdownInQdrant } from "@/actions/storeMarkdownInQdrant";
import { toast } from "sonner";

interface ParseResult {
  success: boolean;
  text?: string;
  fileName?: string;
  sourceUrl?: string;
  extractionDate?: string;
  error?: string;
}

export default function Page() {
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [extractedMarkdown, setExtractedMarkdown] = useState<string | null>(
    null
  );

  const handleSubmit = async () => {
    setIsExtracting(true);
    setResult(null);

    try {
      const documentUrl =
        "https://dwylojmkbggcdvus.public.blob.vercel-storage.com/shivaji.pdf";
      const parseResult = await parseDocumentFromUrl(documentUrl);
      setResult(parseResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsExtracting(false);
    }
  };

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
              <OverviewContent />
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
                    <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8">
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
                      <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6">
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
                              Extract text from PDF and convert to markdown
                              format
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={async () => {
                            setIsExtracting(true);
                            setResult(null);
                            setExtractedMarkdown(null);
                            try {
                              const parseRes = await parseDocumentFromUrl(
                                uploadedUrl
                              );
                              setResult(parseRes);
                              if (parseRes.success) {
                                setExtractedMarkdown(parseRes.text || "");
                                toast.success(
                                  "Markdown extracted successfully!",
                                  {
                                    description:
                                      "Text has been converted to markdown format",
                                    duration: 3000,
                                  }
                                );
                              } else {
                                toast.error("Extraction failed", {
                                  description:
                                    parseRes.error || "Failed to extract text",
                                  duration: 4000,
                                });
                              }
                            } finally {
                              setIsExtracting(false);
                            }
                          }}
                          disabled={isExtracting || isStoring}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isExtracting ? (
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
                      <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6">
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
                              Extract & Store in Qdrant
                            </h3>
                            <p className="text-sm light:text-gray-600 dark:text-gray-400">
                              Extract text, chunk it, and store in Qdrant for
                              RAG implementation
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
                              const parseRes = await parseDocumentFromUrl(
                                uploadedUrl
                              );
                              if (!parseRes.success || !parseRes.text) {
                                setResult(parseRes);
                                toast.error("Extraction failed", {
                                  description:
                                    parseRes.error || "Failed to extract text",
                                  duration: 4000,
                                });
                                return;
                              }
                              const storeRes = await storeMarkdownInQdrant({
                                markdown: parseRes.text,
                                sourceUrl: uploadedUrl,
                              });
                              if (storeRes.success) {
                                setResult({
                                  success: true,
                                  text: `Successfully stored ${storeRes.points} chunks in Qdrant collection "${storeRes.collection}"`,
                                  sourceUrl: uploadedUrl,
                                  extractionDate: new Date().toISOString(),
                                });
                                toast.success("Document stored in Qdrant!", {
                                  description: `${storeRes.points} chunks stored in collection "${storeRes.collection}"`,
                                  duration: 4000,
                                });
                              } else {
                                setResult({
                                  success: false,
                                  error: storeRes.error,
                                });
                                toast.error("Storage failed", {
                                  description:
                                    storeRes.error ||
                                    "Failed to store in Qdrant",
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
                              <span>Extract & Store in Qdrant</span>
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
                    <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6">
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
                        <div className="light:bg-gradient-to-r light:from-green-50 light:to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-lg">
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
                        </div>

                        {/* Extracted Text Display */}
                        <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                          <div className="light:bg-gradient-to-r light:from-slate-50 light:to-gray-50 dark:from-slate-700 dark:to-slate-600 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
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
                                  Extracted Content
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
                            <div className="light:bg-slate-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
                              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono light:text-gray-800 dark:text-gray-200 p-4 overflow-auto max-h-96">
                                {result.text}
                              </pre>
                            </div>
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
    </SidebarProvider>
  );
}
