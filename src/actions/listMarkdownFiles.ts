"use server";

import { list } from "@vercel/blob";

export async function listMarkdownFiles() {
  try {
    // Get both old and new format files
    const [oldFiles, newFiles] = await Promise.all([
      list({ prefix: "extracted-content-" }),
      list({ prefix: "extracted-" }),
    ]);

    // Combine and filter markdown files
    const allBlobs = [...oldFiles.blobs, ...newFiles.blobs]
      .filter((blob) => blob.pathname.endsWith(".md"))
      .filter(
        (blob, index, self) =>
          // Remove duplicates based on pathname
          index === self.findIndex((b) => b.pathname === blob.pathname)
      );

    // Process files and extract source information
    const markdownFiles = await Promise.all(
      allBlobs.map(async (blob) => {
        let sourceFileName = "document";
        let sourceUrl = "";

        // Try to extract source info from filename for new format
        if (
          blob.pathname.startsWith("extracted-") &&
          !blob.pathname.startsWith("extracted-content-")
        ) {
          // New format: extracted-{sourceFileName}-{timestamp}.md
          const parts = blob.pathname
            .replace("extracted-", "")
            .replace(".md", "")
            .split("-");
          if (parts.length > 1) {
            sourceFileName = parts.slice(0, -1).join("-"); // Everything except the last part (timestamp)
          }
        }

        // Try to fetch file content to extract source URL from metadata
        try {
          const response = await fetch(blob.url);
          if (response.ok) {
            const content = await response.text();
            const sourceUrlMatch = content.match(/\*\*Source URL:\*\*\s*(.+)/);
            if (sourceUrlMatch) {
              sourceUrl = sourceUrlMatch[1].trim();
              // Extract filename from URL if we don't have it from filename
              if (sourceFileName === "document" && sourceUrl) {
                try {
                  const url = new URL(sourceUrl);
                  const pathParts = url.pathname.split("/");
                  const lastPart = pathParts[pathParts.length - 1];
                  if (lastPart && lastPart.includes(".")) {
                    sourceFileName = lastPart.split(".")[0];
                  }
                } catch {
                  // If URL parsing fails, keep the default
                }
              }
            }
          }
        } catch {
          // If fetching content fails, continue with default values
        }

        return {
          url: blob.url,
          fileName: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt.toISOString(),
          downloadUrl: blob.downloadUrl,
          sourceUrl: sourceUrl || undefined,
          sourceFileName:
            sourceFileName !== "document" ? sourceFileName : undefined,
        };
      })
    );

    // Sort by creation date (newest first)
    const sortedFiles = markdownFiles.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return {
      success: true,
      files: sortedFiles,
    } as const;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list files",
      files: [],
    } as const;
  }
}
