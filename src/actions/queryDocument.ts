"use server";

import { QdrantClient } from "@qdrant/js-client-rest";
import { HuggingFaceAPIEmbedding } from "@/lib/embedModel";
import Groq from "groq-sdk";
import { matchesGlob } from "path";

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
    const groqModel = process.env.GROQ_MODEL || "openai/gpt-oss-20b6";
    const collection = process.env.QDRANT_COLLECTION || "RAG_DOCUMENTS";

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

    const questionEmbedding = await embeddingModel.getQueryEmbedding(question);
    if (!questionEmbedding) {
      return {
        success: false,
        error: "Failed to generate question embedding",
      };
    }

    console.log("Searching Qdrant with:", {
      collection,
      sourceUrl,
      embeddingLength: questionEmbedding.length,
    });

    let searchResult;
    try {
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

    const historyContext = chatHistory
      .slice(-6)
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const maxContextLength = 3000;
    const truncatedContext =
      context.length > maxContextLength
        ? context.substring(0, maxContextLength) + "..."
        : context;
    console.log("truncatedContext : ", truncatedContext);
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

    console.log("Calling Groq API with:", {
      model: groqModel,
      systemPromptLength: systemPrompt.length,
      questionLength: question.length,
    });

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
      reasoning_effort: "medium",
      temperature: 0.1,
      presence_penalty: 0.6,
      frequency_penalty: 0.5,
      max_tokens: 8000,
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
