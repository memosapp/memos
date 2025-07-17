import { genAI } from "../config/gemini";
import { supabaseAdmin } from "../config/supabase";

/**
 * Generate embedding using Gemini embedContent API
 * Uses gemini-embedding-001 model with 1536 dimensions
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    console.log(`Generating embedding for text: "${text.substring(0, 50)}..."`);

    const response = await genAI.models.embedContent({
      model: "gemini-embedding-001",
      contents: [text],
      config: {
        outputDimensionality: 1536,
      },
    });

    if (!response.embeddings || response.embeddings.length === 0) {
      console.error("No embeddings returned from Gemini");
      return null;
    }

    const embedding = response.embeddings[0];

    // Extract the values array from the embedding object
    const embeddingValues = embedding.values;

    if (!Array.isArray(embeddingValues) || embeddingValues.length !== 1536) {
      console.error(
        `Invalid embedding dimensions: ${
          embeddingValues?.length || 0
        }, expected 1536`
      );
      return null;
    }

    console.log(
      `Successfully generated embedding with ${embeddingValues.length} dimensions`
    );
    return embeddingValues;
  } catch (error) {
    console.error("Error generating embedding with Gemini:", error);
    return null;
  }
}

/**
 * Generate embedding for search queries using Gemini
 */
export async function generateQueryEmbedding(
  text: string
): Promise<number[] | null> {
  return await generateEmbedding(text);
}

/**
 * Generate embedding for memo content and update the database
 */
export async function generateMemoEmbedding(
  memoId: number,
  content: string
): Promise<boolean> {
  try {
    console.log(`Generating embedding for memo ${memoId}...`);

    const embedding = await generateEmbedding(content);

    if (!embedding) {
      console.error(`Failed to generate embedding for memo ${memoId}`);
      return false;
    }

    // Update the memo with the generated embedding
    const { error: updateError } = await supabaseAdmin
      .from("memos")
      .update({ embedding: formatEmbeddingForPostgres(embedding) })
      .eq("id", memoId);

    if (updateError) {
      console.error(
        `Error updating embedding for memo ${memoId}:`,
        updateError
      );
      return false;
    }

    console.log(
      `Successfully generated and stored embedding for memo ${memoId}`
    );
    return true;
  } catch (error) {
    console.error(`Error processing embedding for memo ${memoId}:`, error);
    return false;
  }
}

/**
 * Generate embeddings for all memos missing embeddings
 */
export async function regenerateAllMissingEmbeddings(): Promise<{
  total: number;
  success: number;
  failed: number;
}> {
  try {
    console.log(
      "Starting batch embedding generation for missing embeddings..."
    );

    // Get all memos without embeddings
    const { data: memos, error } = await supabaseAdmin
      .from("memos")
      .select("id, content, summary")
      .is("embedding", null);

    if (error) {
      console.error("Error fetching memos without embeddings:", error);
      return { total: 0, success: 0, failed: 0 };
    }

    if (!memos || memos.length === 0) {
      console.log("No memos found without embeddings");
      return { total: 0, success: 0, failed: 0 };
    }

    console.log(`Found ${memos.length} memos without embeddings`);

    let success = 0;
    let failed = 0;

    // Process each memo
    for (const memo of memos) {
      // Combine summary and content like the embedding_input function
      const content = `${memo.summary || ""} ${memo.content || ""}`.trim();

      if (!content) {
        console.warn(`Memo ${memo.id} has no content to embed`);
        failed++;
        continue;
      }

      const result = await generateMemoEmbedding(memo.id, content);
      if (result) {
        success++;
      } else {
        failed++;
      }

      // Add a small delay to avoid overwhelming the Gemini API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `Batch embedding generation completed: ${success} success, ${failed} failed`
    );
    return { total: memos.length, success, failed };
  } catch (error) {
    console.error("Error in batch embedding generation:", error);
    return { total: 0, success: 0, failed: 0 };
  }
}

/**
 * Format embedding array for PostgreSQL vector type
 */
export function formatEmbeddingForPostgres(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
