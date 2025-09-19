"use server";

import prisma from "@/lib/prisma";
import { testDatabaseConnection } from "./db-messages";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getOverviewData() {
  try {
    console.log("Fetching overview data...");

    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = parseInt(session.user.id);

    // Test database connection first
    await testDatabaseConnection();

    // Get all data in parallel
    const [
      pdfFilesResult,
      totalPagesResult,
      totalQuestionsResult,
      recentQuestionsResult,
      processedDocumentsResult,
    ] = await Promise.all([
      // Only get PDF files (not markdown files) for this user
      prisma.files.findMany({
        where: {
          fileType: "application/pdf",
          userId: userId,
        },
        orderBy: { uploadedAt: "desc" },
        take: 5, // Recent PDF files
      }),
      // Only count pages from PDF files for this user
      prisma.files.aggregate({
        _sum: {
          pageCount: true,
        },
        where: {
          fileType: "application/pdf",
          pageCount: {
            not: null,
          },
          userId: userId,
        },
      }),
      prisma.messages.count({
        where: {
          role: "user",
          userId: userId,
        },
      }),
      prisma.messages.findMany({
        where: {
          role: "user",
          userId: userId,
        },
        orderBy: { createdAt: "desc" },
        take: 5, // Recent questions
        include: {
          conversations: {
            include: {
              files: true,
            },
          },
        },
      }),
      prisma.processed_documents.findMany({
        where: {
          userId: userId,
        },
        orderBy: { processedAt: "desc" },
        take: 5, // Recent processed documents
      }),
    ]);

    // Count only PDF files for this user
    const totalDocuments = await prisma.files.count({
      where: {
        fileType: "application/pdf",
        userId: userId,
      },
    });
    const totalPages = totalPagesResult._sum.pageCount || 0;
    const totalQuestions = totalQuestionsResult;
    const lastUploadedFile = pdfFilesResult[0] || null;
    const recentDocuments = pdfFilesResult;
    const recentQuestions = recentQuestionsResult;
    const recentProcessedDocuments = processedDocumentsResult;

    // Debug: Check messages directly for this user
    const allMessages = await prisma.messages.findMany({
      where: {
        userId: userId,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    console.log("All messages in database:", allMessages.length);
    console.log(
      "Sample messages:",
      allMessages.slice(0, 3).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content.substring(0, 50),
      }))
    );

    console.log("Overview data counts:", {
      totalDocuments,
      totalPages,
      totalQuestions,
      recentQuestionsCount: recentQuestions.length,
      recentDocumentsCount: recentDocuments.length,
    });

    return {
      success: true,
      data: {
        totalDocuments,
        totalPages,
        totalQuestions,
        lastUploadedFile,
        recentDocuments,
        recentQuestions,
        recentProcessedDocuments,
      },
    };
  } catch (error) {
    console.error("Error fetching overview data:", error);
    return {
      success: false,
      error: "Failed to fetch overview data",
      data: {
        totalDocuments: 0,
        totalPages: 0,
        totalQuestions: 0,
        lastUploadedFile: null,
        recentDocuments: [],
        recentQuestions: [],
        recentProcessedDocuments: [],
      },
    };
  }
}
