"use server";

import { put } from "@vercel/blob";

export async function uploadMarkdownToBlob(
  markdownContent: string,
  sourceUrl: string,
  extractionDate: string
) {
  try {
    // Extract filename from URL or create a descriptive name
    let sourceFileName = "document";
    try {
      const url = new URL(sourceUrl);
      const pathParts = url.pathname.split("/");
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.includes(".")) {
        sourceFileName = lastPart.split(".")[0]; // Remove extension
      }
    } catch {
      // If URL parsing fails, use a default name
    }

    const timestamp = Date.now();
    const fileName = `extracted-${sourceFileName}-${timestamp}.md`;
    const blob = new Blob([markdownContent], { type: "text/markdown" });

    const { url } = await put(fileName, blob, {
      access: "public",
      contentType: "text/markdown",
    });

    return {
      success: true,
      url,
      fileName,
      sourceUrl,
      extractionDate,
      sourceFileName,
    } as const;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    } as const;
  }
}
