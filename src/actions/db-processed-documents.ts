"use server";

import { prisma } from "@/lib/prisma";

export async function createProcessedDocument(data: {
  id: string;
  fileName: string;
  fileUrl: string;
  chunkCount: number;
  pageCount?: number;
  sourceUrl?: string;
  sourceFileName?: string;
}) {
  try {
    const processedDocument = await prisma.processed_documents.create({
      data: {
        id: data.id,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        chunkCount: data.chunkCount,
        pageCount: data.pageCount,
        sourceUrl: data.sourceUrl,
        sourceFileName: data.sourceFileName,
      },
    });
    return { success: true, processedDocument };
  } catch (error) {
    console.error("Error creating processed document:", error);
    return { success: false, error: "Failed to create processed document" };
  }
}

export async function getProcessedDocuments() {
  try {
    const processedDocuments = await prisma.processed_documents.findMany({
      orderBy: { processedAt: "desc" },
    });
    return { success: true, processedDocuments };
  } catch (error) {
    console.error("Error fetching processed documents:", error);
    return { success: false, error: "Failed to fetch processed documents" };
  }
}

export async function getProcessedDocumentById(id: string) {
  try {
    const processedDocument = await prisma.processed_documents.findUnique({
      where: { id },
    });
    return { success: true, processedDocument };
  } catch (error) {
    console.error("Error fetching processed document:", error);
    return { success: false, error: "Failed to fetch processed document" };
  }
}

export async function deleteProcessedDocument(id: string) {
  try {
    // First check if the document exists
    const existingDocument = await prisma.processed_documents.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      console.warn(`Processed document with id ${id} not found`);
      return {
        success: true,
        message: "Document not found, nothing to delete",
      };
    }

    await prisma.processed_documents.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting processed document:", error);
    return { success: false, error: "Failed to delete processed document" };
  }
}

export async function getTotalChunks() {
  try {
    const result = await prisma.processed_documents.aggregate({
      _sum: {
        chunkCount: true,
      },
    });
    return { success: true, totalChunks: result._sum.chunkCount || 0 };
  } catch (error) {
    console.error("Error calculating total chunks:", error);
    return { success: false, error: "Failed to calculate total chunks" };
  }
}
