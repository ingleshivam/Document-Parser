"use server";

import { del } from "@vercel/blob";

export async function deleteMarkdownFile(url: string) {
  try {
    await del(url);

    return {
      success: true,
    } as const;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    } as const;
  }
}
