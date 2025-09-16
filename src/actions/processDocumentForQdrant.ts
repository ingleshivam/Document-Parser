"use server";

import { LlamaParseReader } from "llama-cloud-services";
import { storeMarkdownInQdrant } from "./storeMarkdownInQdrant";
import "dotenv/config";

export async function processDocumentForQdrant(url: string) {
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
    console.log(`Processing document for Qdrant from URL: ${url}`);
    const documents = await parser.loadData(url);

    if (documents && documents.length > 0) {
      let extractedText = "";

      for (const doc of documents) {
        if (doc.text) {
          extractedText += doc.text + "\n\n";
        }
      }

      // Store directly in Qdrant without creating markdown file
      const storeResult = await storeMarkdownInQdrant({
        markdown: extractedText,
        sourceUrl: url,
      });

      if (storeResult.success) {
        console.log(
          `\n✅ Document processed and stored in Qdrant: ${storeResult.points} chunks in collection "${storeResult.collection}"`
        );

        return {
          success: true,
          message: `Successfully processed and stored ${storeResult.points} chunks in Qdrant collection "${storeResult.collection}"`,
          points: storeResult.points,
          collection: storeResult.collection,
          sourceUrl: url,
          processingDate: new Date().toISOString(),
          pageCount: documents.length, // Number of documents = number of pages
        };
      } else {
        console.error("Failed to store in Qdrant:", storeResult.error);
        return {
          success: false,
          error: storeResult.error || "Failed to store in Qdrant",
        };
      }
    } else {
      console.log("No content was returned. Check the URL and file type.");
      return {
        success: false,
        error: "No content was returned. Check the URL and file type.",
      };
    }
  } catch (error) {
    console.error("An error occurred during document processing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
