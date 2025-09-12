"use server";

import { QdrantClient } from "@qdrant/js-client-rest";
import { HuggingFaceAPIEmbedding } from "@/lib/embedModel";
import Groq from "groq-sdk";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface QueryResult {
  success: boolean;
  answer?: string;
  sources?: Array<{
    text: string;
    sourceUrl: string;
    pageNumber?: number;
    score: number;
  }>;
  error?: string;
}

export async function queryDocument(
  question: string,
  sourceUrl: string,
  chatHistory: ChatMessage[] = []
): Promise<QueryResult> {
  try {
    const qdrantUrl = process.env.QDRANT_URL;
    const qdrantApiKey = process.env.QDRANT_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;
    const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    const collection = process.env.QDRANT_COLLECTION || "documents";

    console.log("Environment check:", {
      hasQdrantUrl: !!qdrantUrl,
      hasGroqApiKey: !!groqApiKey,
      groqModel,
      collection,
    });

    if (!qdrantUrl || !groqApiKey) {
      return {
        success: false,
        error: "Missing QDRANT_URL or GROQ_API_KEY in environment",
      };
    }

    const client = new QdrantClient({ url: qdrantUrl, apiKey: qdrantApiKey });
    const embeddingModel = new HuggingFaceAPIEmbedding();
    const groq = new Groq({ apiKey: groqApiKey });

    // Check if collection exists and get its info
    try {
      const collectionInfo = await client.getCollection(collection);
      console.log("Collection info:", {
        status: collectionInfo.status,
        vectorsCount: collectionInfo.vectors_count,
        pointsCount: collectionInfo.points_count,
      });
    } catch (collectionError) {
      console.log("Collection check failed:", collectionError);
      return {
        success: false,
        error: `Collection '${collection}' not found or inaccessible`,
      };
    }

    // Generate embedding for the question
    const questionEmbedding = await embeddingModel.getQueryEmbedding(question);
    if (!questionEmbedding) {
      return {
        success: false,
        error: "Failed to generate question embedding",
      };
    }

    // Search for relevant chunks
    console.log("Searching Qdrant with:", {
      collection,
      sourceUrl,
      embeddingLength: questionEmbedding.length,
    });

    // Try different filter structures
    let searchResult;
    try {
      // First try with the original filter structure
      searchResult = await client.search(collection, {
        vector: questionEmbedding,
        filter: {
          must: [
            {
              key: "sourceUrl",
              match: { value: sourceUrl },
            },
          ],
        },
        limit: 5,
        with_payload: true,
      });
    } catch (filterError) {
      console.log(
        "Original filter failed, trying alternative filter structure:",
        filterError
      );
      try {
        // Try with different filter structure
        searchResult = await client.search(collection, {
          vector: questionEmbedding,
          filter: {
            must: [
              {
                key: "sourceUrl",
                match: { any: [sourceUrl] },
              },
            ],
          },
          limit: 5,
          with_payload: true,
        });
      } catch (altFilterError) {
        console.log(
          "Alternative filter failed, trying without filter:",
          altFilterError
        );
        // Try without filter
        searchResult = await client.search(collection, {
          vector: questionEmbedding,
          limit: 5,
          with_payload: true,
        });
      }
    }

    console.log("Qdrant search result:", {
      resultCount: searchResult.length,
      results: searchResult.map((r) => ({
        score: r.score,
        hasPayload: !!r.payload,
        payloadKeys: r.payload ? Object.keys(r.payload) : [],
      })),
    });

    if (searchResult.length === 0) {
      return {
        success: false,
        error: "No relevant information found for this question",
      };
    }

    // Prepare context from search results
    const context = searchResult
      .map((result) => {
        const payload = result.payload as any;
        console.log("Processing result payload:", {
          hasText: !!payload.text,
          textLength: payload.text?.length || 0,
          pageNumber: payload.pageNumber,
          sourceUrl: payload.sourceUrl,
        });
        return `Page ${payload.pageNumber || "N/A"}: ${payload.text}`;
      })
      .join("\n\n");

    console.log("Final context:", {
      contextLength: context.length,
      contextPreview: context.substring(0, 200) + "...",
    });

    // Prepare chat history for context
    const historyContext = chatHistory
      .slice(-6) // Keep last 6 messages for context
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    // Create the prompt for Groq - limit context length to avoid token limits
    const maxContextLength = 3000; // Limit context to avoid token limits
    const truncatedContext =
      context.length > maxContextLength
        ? context.substring(0, maxContextLength) + "..."
        : context;

    // If context is too short, provide a fallback message
    if (truncatedContext.length < 50) {
      return {
        success: false,
        error:
          "Insufficient context found in the document. The document may not contain relevant information for this question.",
      };
    }

    const systemPrompt = `You are a helpful assistant that answers questions based on the provided document context. Use only the information from the context to answer questions. If the context doesn't contain enough information to answer the question, say so.

Context from document:
${truncatedContext}

${historyContext ? `\nPrevious conversation:\n${historyContext}` : ""}

Please provide a helpful and accurate answer based on the document context.`;

    console.log("System prompt length:", systemPrompt.length);

    // Query Groq
    console.log("Calling Groq API with:", {
      model: groqModel,
      systemPromptLength: systemPrompt.length,
      questionLength: question.length,
    });

    // Try a simpler approach first
    const userMessage = `Based on this document context, please answer the question.

Context: ${truncatedContext}

Question: ${question}

Please provide a helpful answer based on the context above.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
      model: groqModel,
      temperature: 0.1,
      max_tokens: 500,
    });

    console.log("Groq API response:", {
      hasChoices: !!completion.choices,
      choicesLength: completion.choices?.length,
      firstChoice: completion.choices?.[0],
    });

    const answer = completion.choices[0]?.message?.content;

    if (!answer) {
      return {
        success: false,
        error: "No answer generated from Groq API",
      };
    }

    // Prepare sources
    const sources = searchResult.map((result) => {
      const payload = result.payload as any;
      return {
        text: payload.text.substring(0, 200) + "...",
        sourceUrl: payload.sourceUrl,
        pageNumber: payload.pageNumber,
        score: result.score,
      };
    });

    return {
      success: true,
      answer,
      sources,
    };
  } catch (error) {
    console.error("Error in queryDocument:", error);

    // Handle specific Groq API errors
    if (error instanceof Error) {
      if (error.message.includes("401")) {
        return {
          success: false,
          error:
            "Invalid Groq API key. Please check your GROQ_API_KEY environment variable.",
        };
      }
      if (error.message.includes("400")) {
        return {
          success: false,
          error:
            "Bad request to Groq API. Please check your model name and parameters.",
        };
      }
      if (error.message.includes("429")) {
        return {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        };
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to query document",
    };
  }
}
