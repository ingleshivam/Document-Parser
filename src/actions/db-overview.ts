"use server";

import { prisma } from "@/lib/prisma";
import { testDatabaseConnection } from "./db-messages";

export async function getOverviewData() {
  try {
    console.log("Fetching overview data...");

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
      // Only get PDF files (not markdown files)
      prisma.files.findMany({
        where: {
          fileType: "application/pdf",
        },
        orderBy: { uploadedAt: "desc" },
        take: 5, // Recent PDF files
      }),
      // Only count pages from PDF files
      prisma.files.aggregate({
        _sum: {
          pageCount: true,
        },
        where: {
          fileType: "application/pdf",
          pageCount: {
            not: null,
          },
        },
      }),
      prisma.messages.count({
        where: {
          role: "user",
        },
      }),
      prisma.messages.findMany({
        where: {
          role: "user",
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
        orderBy: { processedAt: "desc" },
        take: 5, // Recent processed documents
      }),
    ]);

    // Count only PDF files
    const totalDocuments = await prisma.files.count({
      where: {
        fileType: "application/pdf",
      },
    });
    const totalPages = totalPagesResult._sum.pageCount || 0;
    const totalQuestions = totalQuestionsResult;
    const lastUploadedFile = pdfFilesResult[0] || null;
    const recentDocuments = pdfFilesResult;
    const recentQuestions = recentQuestionsResult;
    const recentProcessedDocuments = processedDocumentsResult;

    // Debug: Check messages directly
    const allMessages = await prisma.messages.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    console.log("All messages in database:", allMessages.length);
    console.log(
      "Sample messages:",
      allMessages
        .slice(0, 3)
        .map((m) => ({
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
