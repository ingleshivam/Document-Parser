"use server";

import { deleteProcessedDocument } from "./db-processed-documents";
import { deleteFromQdrant } from "./deleteFromQdrant";
import { deleteFile } from "./db-files";
import { deleteConversation } from "./db-conversations";
import { prisma } from "@/lib/prisma";

export async function deleteProcessedDocumentWithQdrant(
  documentId: string,
  sourceUrl: string
) {
  try {
    // 1. Delete from Qdrant first
    const qdrantResult = await deleteFromQdrant(sourceUrl);
    if (!qdrantResult.success) {
      console.warn("Failed to delete from Qdrant:", qdrantResult.error);
      // Continue with database cleanup even if Qdrant deletion fails
    }

    // 2. Delete all conversations related to this document
    const conversations = await prisma.conversations.findMany({
      where: { fileId: documentId },
    });

    for (const conversation of conversations) {
      await deleteConversation(conversation.id);
    }

    // 3. Delete the processed document from database
    const processedDocResult = await deleteProcessedDocument(documentId);
    if (!processedDocResult.success) {
      console.warn(
        "Failed to delete processed document:",
        processedDocResult.error
      );
      // Continue with file deletion even if processed document deletion fails
    } else {
      console.log("Successfully deleted processed document");
    }

    // 4. Delete the original file from database
    const fileResult = await deleteFile(documentId);
    if (!fileResult.success) {
      console.warn("Failed to delete file from database:", fileResult.error);
    }

    return {
      success: true,
      message: "Document and all related data deleted successfully",
      qdrantDeleted: qdrantResult.success,
      conversationsDeleted: conversations.length,
      processedDocDeleted: processedDocResult.success,
      fileDeleted: fileResult.success,
    };
  } catch (error) {
    console.error("Error deleting processed document:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete document",
    };
  }
}
