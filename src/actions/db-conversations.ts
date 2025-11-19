"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function createConversation(data: {
  id: string;
  title: string;
  fileId?: string;
  processedFileId?: string;
}) {
  console.log("Conversation Data : ", data);
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const conversation = await prisma.conversations.create({
      data: {
        id: data.id,
        title: data.title,
        fileId: data.fileId,
        documentId: data.processedFileId,
        userId: userId,
        updatedAt: new Date(),
      },
    });
    return { success: true, conversation };
  } catch (error) {
    console.error("Error creating conversation:", error);
    return { success: false, error: "Failed to create conversation" };
  }
}

export async function getConversations() {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const conversations = await prisma.conversations.findMany({
      where: { userId },
      include: {
        files: true,
        processed_documents: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return { success: true, conversations };
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return { success: false, error: "Failed to fetch conversations" };
  }
}

export async function getConversationById(id: string) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const conversation = await prisma.conversations.findFirst({
      where: {
        id,
        userId: userId,
      },
      include: {
        files: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return { success: true, conversation };
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return { success: false, error: "Failed to fetch conversation" };
  }
}

export async function updateConversation(
  id: string,
  data: {
    title?: string;
    fileId?: string;
    processedFileId?: string;
  }
) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const conversation = await prisma.conversations.updateMany({
      where: {
        id,
        userId: userId,
      },
      data: {
        title: data.title,
        fileId: data.fileId,
        documentId: data.processedFileId,
        userId: userId,
        updatedAt: new Date(),
      },
    });
    return { success: true, conversation };
  } catch (error) {
    console.error("Error updating conversation:", error);
    return { success: false, error: "Failed to update conversation" };
  }
}

export async function deleteConversation(id: string) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    await prisma.conversations.deleteMany({
      where: {
        id,
        userId: userId,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return { success: false, error: "Failed to delete conversation" };
  }
}

export async function getTotalQuestions() {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const result = await prisma.messages.count({
      where: {
        role: "user",
        userId: userId,
      },
    });
    return { success: true, totalQuestions: result };
  } catch (error) {
    console.error("Error calculating total questions:", error);
    return { success: false, error: "Failed to calculate total questions" };
  }
}
