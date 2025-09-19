import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get user statistics
    const [
      totalDocuments,
      totalQuestions,
      totalConversations,
      totalProcessedDocuments,
    ] = await Promise.all([
      // Count files uploaded by user
      prisma.files.count({
        where: { userId },
      }),
      // Count messages where role is 'user' (questions)
      prisma.messages.count({
        where: {
          userId,
          role: "user",
        },
      }),
      // Count conversations created by user
      prisma.conversations.count({
        where: { userId },
      }),
      // Count processed documents by user
      prisma.processed_documents.count({
        where: { userId },
      }),
    ]);

    return NextResponse.json({
      totalDocuments,
      totalQuestions,
      totalConversations,
      totalProcessedDocuments,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
