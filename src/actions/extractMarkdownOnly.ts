"use server";

import { LlamaParseReader } from "llama-cloud-services";
import { uploadMarkdownToBlob } from "./uploadMarkdownToBlob";
import "dotenv/config";

export async function extractMarkdownOnly(url: string) {
  const apiKey = process.env.LLAMA_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error("LLAMA_CLOUD_API_KEY environment variable is not set.");
  }

  const parser = new LlamaParseReader({
    apiKey,
    resultType: "markdown",
    verbose: true,
  });

  try {
    console.log(`Extracting markdown from URL: ${url}`);
    const documents = await parser.loadData(url);

    if (documents && documents.length > 0) {
      let extractedText = "";

      for (const doc of documents) {
        if (doc.text) {
          extractedText += doc.text + "\n\n";
        }
      }

      const extractionDate = new Date().toISOString();
      const markdownContent = `# Extracted Document Content

**Source URL:** ${url}
**Extraction Date:** ${extractionDate}

---

${extractedText}`;

      // Upload to Vercel Blob
      const uploadResult = await uploadMarkdownToBlob(
        markdownContent,
        url,
        extractionDate
      );

      if (!uploadResult.success) {
        console.error("Failed to upload markdown to blob:", uploadResult.error);
        return {
          success: false,
          error: `Failed to save markdown: ${uploadResult.error}`,
        };
      }

      console.log(
        `\n✅ Markdown extracted and saved to Vercel Blob: ${uploadResult.fileName}`
      );
      console.log(`📁 Blob URL: ${uploadResult.url}`);

      return {
        success: true,
        text: extractedText,
        fileName: uploadResult.fileName,
        blobUrl: uploadResult.url,
        sourceUrl: url,
        extractionDate: extractionDate,
        sourceFileName: uploadResult.sourceFileName,
      };
    } else {
      console.log("No content was returned. Check the URL and file type.");
      return {
        success: false,
        error: "No content was returned. Check the URL and file type.",
      };
    }
  } catch (error) {
    console.error("An error occurred during markdown extraction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
