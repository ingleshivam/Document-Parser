"use client";
import { getFiles } from "@/actions/db-files";
import { extractMarkdownOnly } from "@/actions/extractMarkdownOnly";
import { listMarkdownFiles } from "@/actions/listMarkdownFiles";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MarkdownFile {
  url: string;
  fileName: string;
  size: number;
  uploadedAt: string;
  downloadUrl: string;
  sourceUrl?: string;
  sourceFileName?: string;
}

export default function PdfFiles() {
  const [isLoadingPdfFiles, setIsLoadingPdfFiles] = useState(false); // global refresh flag
  const [pdfFiles, setPdfFiles] = useState<any[]>([]);
  const [isExtractingMarkdown, setIsExtractingMarkdown] = useState(false);
  const [dbFiles, setDbFiles] = useState<any[]>([]);
  const [markdownFiles, setMarkdownFiles] = useState<MarkdownFile[]>([]);

  // loadDbFiles just fetches and sets its own state
  const loadDbFiles = async () => {
    try {
      console.log("Loading database files...");
      const result = await getFiles();
      console.log("Files result:", result);
      if (result.success && result.files) {
        setDbFiles(result.files); // This will trigger the useEffect
        console.log("Loaded", result.files.length, "files from database");
      } else {
        console.warn("getFiles returned no files or success=false", result);
        setDbFiles([]); // Set to empty on failure to trigger effect
      }
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("Failed to load DB files");
      setDbFiles([]); // Set to empty on error to trigger effect
    }
  };

  // loadMarkdownFiles just fetches and sets its own state
  const loadMarkdownFiles = async () => {
    try {
      const result = await listMarkdownFiles();
      console.log("listMarkdownFiles result:", result);
      if (result.success && result.files) {
        setMarkdownFiles(result.files); // This will trigger the useEffect
      } else {
        toast.error("Failed to load markdown files", {
          description: result.error,
        });
        setMarkdownFiles([]); // Set to empty on failure
      }
    } catch (error) {
      console.error("Error listing markdown files:", error);
      toast.error("Failed to load files");
      setMarkdownFiles([]); // Set to empty on error
    }
  };

  // NEW: This effect runs whenever dbFiles or markdownFiles state changes.
  // This is where we compute the derived pdfFiles state.
  useEffect(() => {
    console.log("Dependencies changed, computing PDF files...");

    // We can skip computation if dbFiles isn't loaded yet,
    // but the loading spinner will still be active.
    if (!dbFiles) {
      return;
    }

    try {
      const pdfFilesFromDb = (dbFiles || []).filter(
        (file) => file.fileType === "application/pdf"
      );

      console.log("Found PDF files in database:", pdfFilesFromDb.length);

      const pdfFilesWithStatus = pdfFilesFromDb.map((file) => {
        const hasMarkdown = (markdownFiles || []).some(
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
      });

      setPdfFiles(pdfFilesWithStatus); // Update the final list
      console.log("Loaded PDF files with status:", pdfFilesWithStatus);
    } catch (error) {
      console.error("Error computing PDF files:", error);
      toast.error("Failed to process PDF file list");
    } finally {
      setIsLoadingPdfFiles(false);
      console.log("Finished computing PDF files");
    }
  }, [dbFiles, markdownFiles]);

  const handleParsePdf = async (pdfFile: any) => {
    try {
      setIsExtractingMarkdown(true);
      const result = await extractMarkdownOnly(pdfFile.url);

      if (result.success) {
        // SUCCESS: We only need to reload the markdown files.
        // The useEffect hook will automatically re-compute the
        // pdfFiles list and update the UI.
        await loadMarkdownFiles();
        toast.success("PDF parsed successfully!", {
          description: "Markdown file has been generated",
        });
      } else {
        toast.error("Failed to parse PDF", {
          description: result.error || "Unknown error occurred",
        });
      }
    } catch (error) {
      console.error("Error parsing PDF:", error);
      toast.error("Failed to parse PDF");
    } finally {
      setIsExtractingMarkdown(false);
    }
  };

  // REVISED: This function just sets the loading flag
  // and kicks off the parallel data fetches.
  const refreshAll = async () => {
    setIsLoadingPdfFiles(true); // Turn spinner ON
    try {
      // Load both in parallel. When they finish, they will
      // set their state, which will trigger the useEffect.
      await Promise.all([loadDbFiles(), loadMarkdownFiles()]);
    } catch (error) {
      console.error("Error during refresh:", error);
      // Ensure spinner turns off even if the fetches fail
      setIsLoadingPdfFiles(false);
    }
  };

  // This useEffect on mount is unchanged and correct.
  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="text-center mb-8  py-8">
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

        <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border light:border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold light:text-gray-900 dark:text-white">
              PDF Files
            </h3>
            <Button
              onClick={async () => {
                try {
                  await refreshAll();
                } catch (error) {
                  console.error("Error refreshing files:", error);
                  toast.error("Failed to refresh files", {
                    description: "Please try again",
                  });
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
                  {/* ...rest of your existing rendering for each file (unchanged) */}
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
                          {file.uploadedAt
                            ? new Date(file.uploadedAt).toLocaleDateString()
                            : "Unknown date"}
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
                          onClick={() => window.open(file.url, "_blank")}
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
                          {isExtractingMarkdown ? "Parsing..." : "Parse"}
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
    </>
  );
}
