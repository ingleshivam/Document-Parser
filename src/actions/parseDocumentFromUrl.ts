"use server";

import { LlamaParseReader } from "llama-cloud-services";
import { writeFileSync } from "fs";
import { join } from "path";
import "dotenv/config";

export async function parseDocumentFromUrl(url: string) {
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
    console.log(`Submitting document from URL for parsing: ${url}`);
    const documents = await parser.loadData(url);
    if (documents && documents.length > 0) {
      let extractedText = "";

      for (const doc of documents) {
        if (doc.text) {
          extractedText += doc.text + "\n\n";
        }
      }
      const fileName = `extracted-content-${Date.now()}.md`;
      const filePath = join(process.cwd(), "public", fileName);

      const markdownContent = `# Extracted Document Content

**Source URL:** ${url}
**Extraction Date:** ${new Date().toISOString()}

---

${extractedText}`;

      writeFileSync(filePath, markdownContent, "utf-8");
      console.log(`\n✅ Extracted content saved to: ${fileName}`);
      console.log(`📁 File location: ${filePath}`);

      // Return the extracted text for display
      return {
        success: true,
        text: extractedText,
        fileName: fileName,
        sourceUrl: url,
        extractionDate: new Date().toISOString(),
      };
    } else {
      console.log("No content was returned. Check the URL and file type.");
      return {
        success: false,
        error: "No content was returned. Check the URL and file type.",
      };
    }
  } catch (error) {
    console.error("An error occurred during parsing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
