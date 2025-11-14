"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
    console.log("FILE DATA : ", data);
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const processedDocument = await prisma.processed_documents.create({
      data: {
        id: data.id,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        chunkCount: data.chunkCount,
        pageCount: data.pageCount,
        sourceUrl: data.sourceUrl,
        sourceFileName: data.sourceFileName,
        userId: userId,
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
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const processedDocuments = await prisma.processed_documents.findMany({
      where: { userId },
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
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const processedDocument = await prisma.processed_documents.findFirst({
      where: {
        id,
        userId: userId,
      },
    });
    return { success: true, processedDocument };
  } catch (error) {
    console.error("Error fetching processed document:", error);
    return { success: false, error: "Failed to fetch processed document" };
  }
}

export async function deleteProcessedDocument(id: string) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    // First check if the document exists for this user
    const existingDocument = await prisma.processed_documents.findFirst({
      where: {
        id,
        userId: userId,
      },
    });

    if (!existingDocument) {
      console.warn(
        `Processed document with id ${id} not found for user ${userId}`
      );
      return {
        success: true,
        message: "Document not found, nothing to delete",
      };
    }

    await prisma.processed_documents.deleteMany({
      where: {
        id,
        userId: userId,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting processed document:", error);
    return { success: false, error: "Failed to delete processed document" };
  }
}

export async function getTotalChunks() {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const result = await prisma.processed_documents.aggregate({
      _sum: {
        chunkCount: true,
      },
      where: {
        userId: userId,
      },
    });
    return { success: true, totalChunks: result._sum.chunkCount || 0 };
  } catch (error) {
    console.error("Error calculating total chunks:", error);
    return { success: false, error: "Failed to calculate total chunks" };
  }
}
