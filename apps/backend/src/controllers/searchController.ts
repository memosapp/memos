import { Request, Response } from "express";
import { pool } from "../config/database";
import { generateEmbedding } from "../services/embeddingService";
import { parseTags } from "../utils/tagUtils";
import { Memo, SearchRequest } from "../types";

export const searchMemos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { query, userId, sessionId, limit = 10 }: SearchRequest = req.body;

    if (!query) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Build search query with hybrid search (keyword + semantic)
    let searchQuery = `
      SELECT 
        id, session_id, user_id, content, summary, author_role, importance, access_count, tags, created_at, updated_at,
        (
          CASE 
            WHEN content ILIKE $1 THEN 1.0
            WHEN summary ILIKE $1 THEN 0.8
            ELSE 0.0
          END
        ) as keyword_score,
        (1 - (embedding <=> $2)) as semantic_score,
        (
          CASE 
            WHEN content ILIKE $1 THEN 1.0
            WHEN summary ILIKE $1 THEN 0.8
            ELSE 0.0
          END
        ) * 0.3 + (1 - (embedding <=> $2)) * 0.7 as combined_score
      FROM memos
      WHERE 1=1
    `;

    const searchParams: any[] = [`%${query}%`, JSON.stringify(queryEmbedding)];
    let paramIndex = 3;

    if (userId) {
      searchQuery += ` AND user_id = $${paramIndex++}`;
      searchParams.push(userId);
    }

    if (sessionId) {
      searchQuery += ` AND session_id = $${paramIndex++}`;
      searchParams.push(sessionId);
    }

    searchQuery += ` ORDER BY combined_score DESC LIMIT $${paramIndex}`;
    searchParams.push(Number(limit));

    const result = await pool.query(searchQuery, searchParams);

    const memos: Memo[] = result.rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      content: row.content,
      summary: row.summary,
      authorRole: row.author_role,
      importance: row.importance,
      accessCount: row.access_count,
      tags: parseTags(row.tags),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(memos);
  } catch (error) {
    console.error("Error searching memos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
