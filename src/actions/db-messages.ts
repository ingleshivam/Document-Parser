"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function createMessage(data: {
  id: string;
  conversationId: string;
  role: string;
  content: string;
}) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    console.log("Creating message with data:", {
      id: data.id,
      conversationId: data.conversationId,
      role: data.role,
      contentLength: data.content.length,
      userId: userId,
    });

    const message = await prisma.messages.create({
      data: {
        id: data.id,
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        userId: userId,
      },
    });

    console.log("Message created successfully:", message.id);
    return { success: true, message };
  } catch (error) {
    console.error("Error creating message:", error);
    return { success: false, error: "Failed to create message" };
  }
}

export async function getMessagesByConversationId(conversationId: string) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    console.log("Fetching messages for conversation:", conversationId);

    const messages = await prisma.messages.findMany({
      where: {
        conversationId,
        userId: userId,
      },
      orderBy: { createdAt: "asc" },
    });

    console.log("Found messages:", messages.length);
    return { success: true, messages };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, error: "Failed to fetch messages" };
  }
}

export async function updateMessage(
  id: string,
  data: {
    content?: string;
  }
) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const message = await prisma.messages.updateMany({
      where: {
        id,
        userId: userId,
      },
      data,
    });
    return { success: true, message };
  } catch (error) {
    console.error("Error updating message:", error);
    return { success: false, error: "Failed to update message" };
  }
}

// Test function to verify database connection
export async function testDatabaseConnection() {
  try {
    console.log("Testing database connection...");

    // Test 1: Count all messages
    const messageCount = await prisma.messages.count();
    console.log("Total messages in database:", messageCount);

    // Test 2: Get all conversations
    const conversationCount = await prisma.conversations.count();
    console.log("Total conversations in database:", conversationCount);

    // Test 3: Get recent messages
    const recentMessages = await prisma.messages.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    console.log(
      "Recent messages:",
      recentMessages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content.substring(0, 30),
      }))
    );

    return { success: true, messageCount, conversationCount };
  } catch (error) {
    console.error("Database connection test failed:", error);
    return { success: false, error: "Database connection failed" };
  }
}

export async function deleteMessage(id: string) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    await prisma.messages.deleteMany({
      where: {
        id,
        userId: userId,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting message:", error);
    return { success: false, error: "Failed to delete message" };
  }
}

export async function getRecentQuestions(limit: number = 5) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const messages = await prisma.messages.findMany({
      where: {
        role: "user",
        userId: userId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        conversations: {
          include: {
            files: true,
          },
        },
      },
    });
    return { success: true, messages };
  } catch (error) {
    console.error("Error fetching recent questions:", error);
    return { success: false, error: "Failed to fetch recent questions" };
  }
}
