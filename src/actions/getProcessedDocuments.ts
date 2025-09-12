"use server";

import { QdrantClient } from "@qdrant/js-client-rest";

export interface ProcessedDocument {
  id: string;
  title: string;
  sourceUrl: string;
  createdAt: string;
  chunkCount: number;
}

export async function getProcessedDocuments() {
  try {
    const qdrantUrl = process.env.QDRANT_URL;
    const qdrantApiKey = process.env.QDRANT_API_KEY;
    const collection = process.env.QDRANT_COLLECTION || "documents";

    if (!qdrantUrl) {
      return {
        success: false,
        error: "Missing QDRANT_URL in environment",
        documents: [],
      };
    }

    const client = new QdrantClient({ url: qdrantUrl, apiKey: qdrantApiKey });

    // Get collection info to check if it exists
    try {
      const collectionInfo = await client.getCollection(collection);
      if (!collectionInfo) {
        return {
          success: true,
          documents: [],
        };
      }
    } catch {
      return {
        success: true,
        documents: [],
      };
    }

    // Get all points to extract unique documents
    const scrollResult = await client.scroll(collection, {
      limit: 1000,
      with_payload: true,
      with_vector: false,
    });

    // Group points by sourceUrl to get unique documents
    const documentMap = new Map<string, ProcessedDocument>();

    scrollResult.points.forEach((point) => {
      const payload = point.payload as any;
      const sourceUrl = payload.sourceUrl;
      const title = payload.title || "Untitled Document";
      const createdAt = payload.createdAt;

      if (sourceUrl && !documentMap.has(sourceUrl)) {
        documentMap.set(sourceUrl, {
          id: sourceUrl,
          title,
          sourceUrl,
          createdAt,
          chunkCount: 1,
        });
      } else if (sourceUrl && documentMap.has(sourceUrl)) {
        const doc = documentMap.get(sourceUrl)!;
        doc.chunkCount += 1;
      }
    });

    const documents = Array.from(documentMap.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      success: true,
      documents,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get documents",
      documents: [],
    };
  }
}
