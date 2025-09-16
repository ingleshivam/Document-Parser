"use server";

import { prisma } from "@/lib/prisma";

export async function createConversation(data: {
  id: string;
  title: string;
  fileId?: string;
}) {
  try {
    const conversation = await prisma.conversations.create({
      data: {
        id: data.id,
        title: data.title,
        fileId: data.fileId,
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
    const conversations = await prisma.conversations.findMany({
      include: {
        files: true,
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
    const conversation = await prisma.conversations.findUnique({
      where: { id },
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
  }
) {
  try {
    const conversation = await prisma.conversations.update({
      where: { id },
      data: {
        ...data,
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
    await prisma.conversations.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return { success: false, error: "Failed to delete conversation" };
  }
}

export async function getTotalQuestions() {
  try {
    const result = await prisma.messages.count({
      where: {
        role: "user",
      },
    });
    return { success: true, totalQuestions: result };
  } catch (error) {
    console.error("Error calculating total questions:", error);
    return { success: false, error: "Failed to calculate total questions" };
  }
}
