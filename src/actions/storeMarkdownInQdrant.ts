"use server";

import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";

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
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!qdrantUrl || !openaiKey) {
    return {
      success: false,
      error: "Missing QDRANT_URL or OPENAI_API_KEY in environment",
    };
  }

  try {
    const client = new QdrantClient({ url: qdrantUrl, apiKey: qdrantApiKey });

    // Ensure the collection exists (embedding size 3072 for text-embedding-3-large)
    try {
      await client.getCollection(collection);
    } catch {
      await client.createCollection(collection, {
        vectors: { size: 3072, distance: "Cosine" },
      });
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    // Chunk the markdown for better RAG performance
    const chunks = chunkText(markdown);
    const title = extractTitle(markdown, sourceUrl);
    const createdAt = new Date().toISOString();

    // Generate embeddings for all chunks
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: chunks,
    });

    if (!emb.data || emb.data.length === 0) {
      return { success: false, error: "Failed to generate embeddings" };
    }

    // Prepare points for Qdrant
    const points = chunks.map((chunk, index) => ({
      id: Date.now() + index, // Simple ID generation
      vector: emb.data[index].embedding,
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
