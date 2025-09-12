"use server";

export async function getMarkdownContent(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }

    const content = await response.text();

    return {
      success: true,
      content,
    } as const;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch content",
    } as const;
  }
}
