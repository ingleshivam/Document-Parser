"use server";

import { put } from "@vercel/blob";

export async function uploadPdfToBlob(file: File) {
  if (file.type !== "application/pdf") {
    return {
      success: false,
      error: "Only PDF files are allowed",
    } as const;
  }

  try {
    const fileName = `${Date.now()}-${file.name}`.replace(/\s+/g, "-");
    const { url } = await put(fileName, file, {
      access: "public",
      contentType: file.type || "application/pdf",
    });

    return {
      success: true,
      url,
      fileName,
      pageCount: 0, 
    } as const;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    } as const;
  }
}
