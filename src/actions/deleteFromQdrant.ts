"use server";

import { QdrantClient } from "@qdrant/js-client-rest";

export async function deleteFromQdrant(sourceUrl: string) {
  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantApiKey = process.env.QDRANT_API_KEY;
  const collection = process.env.QDRANT_COLLECTION || "documents";

  if (!qdrantUrl) {
    return {
      success: false,
      error: "Missing QDRANT_URL in environment",
    };
  }

  try {
    const client = new QdrantClient({ url: qdrantUrl, apiKey: qdrantApiKey });
    console.log("sourceUrl : ", sourceUrl);

    // First, try to create an index for sourceUrl if it doesn't exist
    try {
      await client.createPayloadIndex(collection, {
        field_name: "sourceUrl",
        field_schema: "keyword",
      });
      console.log("Created index for sourceUrl field");
    } catch (indexError) {
      // Index might already exist, which is fine
      console.log("Index creation result:", indexError);
    }

    // Now try to delete with the filter
    try {
      const deleteResult = await client.delete(collection, {
        wait: true,
        filter: {
          must: [
            {
              key: "sourceUrl",
              match: {
                value: sourceUrl,
              },
            },
          ],
        },
      });

      return {
        success: true,
        deletedCount: deleteResult.operation_id,
      };
    } catch (deleteError) {
      console.log(
        "Filter-based delete failed, trying alternative approach:",
        deleteError
      );

      // Alternative approach: Get all points and delete by ID
      const scrollResult = await client.scroll(collection, {
        limit: 10000, // Adjust based on your collection size
        with_payload: true,
        with_vector: false,
      });

      const pointsToDelete = scrollResult.points
        .filter((point) => point.payload?.sourceUrl === sourceUrl)
        .map((point) => point.id);

      if (pointsToDelete.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: "No points found with matching sourceUrl",
        };
      }

      const deleteResult = await client.delete(collection, {
        wait: true,
        points: pointsToDelete,
      });

      return {
        success: true,
        deletedCount: deleteResult.operation_id,
        message: `Deleted ${pointsToDelete.length} points by ID`,
      };
    }
  } catch (error) {
    console.error("Error deleting from Qdrant:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete from Qdrant",
    };
  }
}
