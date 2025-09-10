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

interface ParseResult {
  success: boolean;
  text?: string;
  fileName?: string;
  sourceUrl?: string;
  extractionDate?: string;
  error?: string;
}

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
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

                  {/* Parse Button Card */}
                  <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8 max-w-md mx-auto">
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
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold light:text-gray-900 dark:text-white mb-2">
                        Ready to Parse
                      </h3>
                      <p className="text-sm light:text-gray-600 dark:text-gray-400">
                        Click the button below to parse the sample PDF document
                      </p>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Parsing Document...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-5 h-5"
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
                          <span>PARSE PDF FILE</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>

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
                                <p className="text-sm light:text-gray-600 dark:text-gray-400">
                                  Source: {result.sourceUrl}
                                </p>
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
