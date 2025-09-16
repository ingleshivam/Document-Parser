"use server";

import { prisma } from "@/lib/prisma";

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
    const file = await prisma.files.create({
      data: {
        id: data.id,
        url: data.url,
        fileName: data.fileName,
        fileType: data.fileType,
        pageCount: data.pageCount,
        size: data.size,
        sourceUrl: data.sourceUrl,
        sourceFileName: data.sourceFileName,
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
    const files = await prisma.files.findMany({
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
    const file = await prisma.files.findUnique({
      where: { id },
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
    const file = await prisma.files.update({
      where: { id },
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
    await prisma.files.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false, error: "Failed to delete file" };
  }
}

export async function getTotalPages() {
  try {
    const result = await prisma.files.aggregate({
      _sum: {
        pageCount: true,
      },
      where: {
        pageCount: {
          not: null,
        },
      },
    });
    return { success: true, totalPages: result._sum.pageCount || 0 };
  } catch (error) {
    console.error("Error calculating total pages:", error);
    return { success: false, error: "Failed to calculate total pages" };
  }
}
