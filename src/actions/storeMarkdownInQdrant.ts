"use server";

import { QdrantClient } from "@qdrant/js-client-rest";
import { HuggingFaceAPIEmbedding } from "@/lib/embedModel";

type StoreResult =
  | { success: true; collection: string; points: number }
  | { success: false; error: string };

// Chunk text into smaller pieces for better RAG performance
function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at sentence boundaries
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;

    if (start >= text.length) break;
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

// Extract title from markdown (first # heading or filename)
function extractTitle(markdown: string, sourceUrl: string): string {
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  // Fallback to filename from URL
  const urlParts = sourceUrl.split("/");
  const filename = urlParts[urlParts.length - 1];
  return filename.replace(/\.(pdf|md)$/i, "").replace(/[-_]/g, " ");
}

export async function storeMarkdownInQdrant(params: {
  markdown: string;
  sourceUrl: string;
  collection?: string;
}): Promise<StoreResult> {
  const {
    markdown,
    sourceUrl,
    collection = process.env.QDRANT_COLLECTION || "documents",
  } = params;

  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantApiKey = process.env.QDRANT_API_KEY;
  const hfToken = process.env.HF_TOKEN;

  if (!qdrantUrl || !hfToken) {
    return {
      success: false,
      error: "Missing QDRANT_URL or HF_TOKEN in environment",
    };
  }

  try {
    const client = new QdrantClient({ url: qdrantUrl, apiKey: qdrantApiKey });

    // Ensure the collection exists (embedding size 1024 for HuggingFace multilingual-e5-large)
    try {
      await client.getCollection(collection);
    } catch {
      await client.createCollection(collection, {
        vectors: { size: 1024, distance: "Cosine" },
      });
    }

    // Initialize HuggingFace embedding model
    const embeddingModel = new HuggingFaceAPIEmbedding();

    // Chunk the markdown for better RAG performance
    const chunks = chunkText(markdown);
    const title = extractTitle(markdown, sourceUrl);
    const createdAt = new Date().toISOString();

    // Generate embeddings for all chunks using HuggingFace
    const embeddings = await Promise.all(
      chunks.map((chunk) => embeddingModel.getTextEmbedding(chunk))
    );

    if (!embeddings || embeddings.length === 0) {
      return { success: false, error: "Failed to generate embeddings" };
    }

    // Prepare points for Qdrant
    const points = chunks.map((chunk, index) => ({
      id: Date.now() + index, // Simple ID generation
      vector: embeddings[index],
      payload: {
        text: chunk,
        title,
        sourceUrl,
        chunkIndex: index,
        totalChunks: chunks.length,
        createdAt,
        // Extract page numbers if present in markdown
        pageNumber: extractPageNumber(chunk),
      },
    }));

    await client.upsert(collection, {
      wait: true,
      points,
    });

    return { success: true, collection, points: points.length };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to store in Qdrant",
    };
  }
}

// Extract page number from chunk text (look for "Page X" patterns)
function extractPageNumber(text: string): number | null {
  const pageMatch = text.match(/(?:page|p\.?)\s*(\d+)/i);
  return pageMatch ? parseInt(pageMatch[1], 10) : null;
}
