"use server";

import { list } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";

export async function listMarkdownFiles() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", files: [] } as const;
    }

    console.log("Session : ", session);
    const userId = parseInt(session.user.id);

    // ✅ Step 1: Fetch allowed sourceFileNames for this user from DB
    const userFiles = await prisma.files.findMany({
      where: { userId },
      select: { fileName: true },
    });
    console.log("userFiles : ", userFiles);
    const allowedSourceFileNames = userFiles.map((f) => f.fileName);
    console.log("allowedSourceFileNames : ", allowedSourceFileNames);
    // ✅ Step 2: List all markdown blobs
    const [oldFiles, newFiles] = await Promise.all([
      list({ prefix: "extracted-content-" }),
      list({ prefix: "extracted-" }),
    ]);

    const allBlobs = [...oldFiles.blobs, ...newFiles.blobs].filter((blob) =>
      blob.pathname.endsWith(".md")
    );

    // ✅ Step 3: Extract info + filter by DB mapping
    const markdownFiles = await Promise.all(
      allBlobs.map(async (blob) => {
        let sourceFileName = "document";
        let sourceUrl = "";

        // Extract sourceFileName from blob name
        if (
          blob.pathname.startsWith("extracted-") &&
          !blob.pathname.startsWith("extracted-content-")
        ) {
          const parts = blob.pathname
            .replace("extracted-", "")
            .replace(".md", "")
            .split("-");
          if (parts.length > 1) {
            sourceFileName = parts.slice(1, -1).join("-"); // skip first timestamp, remove last timestamp
          }
        }

        // Extract source URL from content if available
        try {
          const response = await fetch(blob.url);
          if (response.ok) {
            const content = await response.text();
            const sourceUrlMatch = content.match(/\*\*Source URL:\*\*\s*(.+)/);
            if (sourceUrlMatch) {
              sourceUrl = sourceUrlMatch[1].trim();
            }
          }
        } catch {}

        return {
          url: blob.url,
          fileName: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt.toISOString(),
          downloadUrl: blob.downloadUrl,
          sourceUrl: sourceUrl || undefined,
          sourceFileName:
            sourceFileName !== "document" ? sourceFileName : undefined,
        };
      })
    );
    console.log("markdownFiles : ", markdownFiles);

    // ✅ Step 4: Only keep files that belong to this user
    const filteredFiles = markdownFiles.filter(
      (file) =>
        file.sourceFileName && 
        allowedSourceFileNames.includes(file.sourceFileName)   
    ); 
    console.log("filteredFiles : ", filteredFiles);
    // ✅ Step 5: Sort newest first
    const sortedFiles = filteredFiles.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return { success: true, files: sortedFiles } as const;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list files",
      files: [],
    } as const;
  }
}
