"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function createFile(data: {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
  pageCount?: number;
  size?: number;
  sourceUrl?: string;
  sourceFileName?: string;
}) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const file = await prisma.files.create({
      data: {
        id: data.id,
        url: data.url,
        fileName: data.fileName?.replace(/\s+/g, "-"),
        fileType: data.fileType,
        pageCount: data.pageCount,
        size: data.size,
        sourceUrl: data.sourceUrl,
        sourceFileName: data.sourceFileName,
        userId: userId,
        updatedAt: new Date(),
      },
    });
    return { success: true, file };
  } catch (error) {
    console.error("Error creating file:", error);
    return { success: false, error: "Failed to create file" };
  }
}

export async function getFiles() {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const files = await prisma.files.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
    });
    return { success: true, files };
  } catch (error) {
    console.error("Error fetching files:", error);
    return { success: false, error: "Failed to fetch files" };
  }
}

export async function getFileById(id: string) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const file = await prisma.files.findFirst({
      where: {
        id,
        userId: userId,
      },
    });
    return { success: true, file };
  } catch (error) {
    console.error("Error fetching file:", error);
    return { success: false, error: "Failed to fetch file" };
  }
}

export async function updateFile(
  id: string,
  data: {
    pageCount?: number;
    size?: number;
    sourceUrl?: string;
    sourceFileName?: string;
  }
) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const file = await prisma.files.updateMany({
      where: {
        id,
        userId: userId,
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return { success: true, file };
  } catch (error) {
    console.error("Error updating file:", error);
    return { success: false, error: "Failed to update file" };
  }
}

export async function deleteFile(id: string) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    await prisma.files.deleteMany({
      where: {
        id,
        userId: userId,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false, error: "Failed to delete file" };
  }
}

export async function getTotalPages() {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    const result = await prisma.files.aggregate({
      _sum: {
        pageCount: true,
      },
      where: {
        pageCount: {
          not: null,
        },
        userId: userId,
      },
    });
    return { success: true, totalPages: result._sum.pageCount || 0 };
  } catch (error) {
    console.error("Error calculating total pages:", error);
    return { success: false, error: "Failed to calculate total pages" };
  }
}
