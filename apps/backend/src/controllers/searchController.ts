import { Request, Response } from "express";
import { pool } from "../config/database";
import { generateEmbedding } from "../services/embeddingService";
import { parseTags, formatTags } from "../utils/tagUtils";
import { Memo, SearchRequest } from "../types";

export const searchMemos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      query,
      userId, // TODO: Get userId from auth middleware instead of request body
      sessionId,
      limit = 10,
      tags,
      authorRole,
      minImportance,
      maxImportance,
      sortBy = "relevance",
      includePopular = false,
      dateRange,
    }: SearchRequest = req.body;

    if (!query) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Build tag matching conditions
    let tagConditions = "";
    if (tags && tags.length > 0) {
      const tagMatches = tags
        .map((_, i) => `array_to_string(tags, ' ') ILIKE $${3 + i}`)
        .join(" OR ");
      tagConditions = `WHEN ${tagMatches} THEN 0.9`;
    }

    // Build enhanced search query with metadata-based scoring using CTE
    let searchQuery = `
      WITH scored_memos AS (
        SELECT 
          id, session_id, user_id, content, summary, author_role, importance, access_count, tags, created_at, updated_at,
          -- Keyword scoring
          (
            CASE 
              WHEN content ILIKE $1 THEN 1.0
              WHEN summary ILIKE $1 THEN 0.8
              ELSE 0.0
            END
          ) as keyword_score,
          -- Semantic scoring
          (1 - (embedding <=> $2)) as semantic_score,
          -- Tag scoring
          (
            CASE 
              WHEN tags IS NOT NULL AND array_length(tags, 1) > 0 THEN
                CASE 
                  WHEN array_to_string(tags, ' ') ILIKE $1 THEN 1.0
                  ${tagConditions}
                  ELSE 0.0
                END
              ELSE 0.0
            END
          ) as tag_score,
          -- Author role scoring
          (
            CASE 
              WHEN author_role = 'system' THEN 0.9
              WHEN author_role = 'agent' THEN 0.8
              WHEN author_role = 'user' THEN 0.7
              ELSE 0.5
            END
          ) as author_score,
          -- Importance scoring (normalized)
          COALESCE(importance, 0.5) as importance_score,
          -- Popularity scoring (normalized access count)
          (
            CASE 
              WHEN access_count > 0 THEN LEAST(1.0, LOG(access_count + 1) / 5.0)
              ELSE 0.1
            END
          ) as popularity_score,
          -- Recency scoring (more recent = higher score)
          (
            CASE 
              WHEN updated_at > NOW() - INTERVAL '1 day' THEN 1.0
              WHEN updated_at > NOW() - INTERVAL '7 days' THEN 0.8
              WHEN updated_at > NOW() - INTERVAL '30 days' THEN 0.6
              WHEN updated_at > NOW() - INTERVAL '90 days' THEN 0.4
              ELSE 0.2
            END
          ) as recency_score
        FROM memos
        WHERE 1=1
      )
      SELECT * FROM scored_memos
      WHERE (keyword_score > 0 OR semantic_score > 0.7 OR tag_score > 0)
    `;

    const searchParams: any[] = [`%${query}%`, JSON.stringify(queryEmbedding)];
    let paramIndex = 3;

    // Add tag parameters
    if (tags && tags.length > 0) {
      tags.forEach((tag) => {
        searchParams.push(`%${tag}%`);
        paramIndex++;
      });
    }

    // Build additional filters for the outer query
    let outerFilters = "";
    if (userId) {
      outerFilters += ` AND user_id = $${paramIndex++}`;
      searchParams.push(userId);
    }

    if (sessionId) {
      outerFilters += ` AND session_id = $${paramIndex++}`;
      searchParams.push(sessionId);
    }

    if (authorRole) {
      outerFilters += ` AND author_role = $${paramIndex++}`;
      searchParams.push(authorRole);
    }

    if (minImportance !== undefined) {
      outerFilters += ` AND importance >= $${paramIndex++}`;
      searchParams.push(minImportance);
    }

    if (maxImportance !== undefined) {
      outerFilters += ` AND importance <= $${paramIndex++}`;
      searchParams.push(maxImportance);
    }

    if (dateRange?.startDate) {
      outerFilters += ` AND created_at >= $${paramIndex++}`;
      searchParams.push(dateRange.startDate);
    }

    if (dateRange?.endDate) {
      outerFilters += ` AND created_at <= $${paramIndex++}`;
      searchParams.push(dateRange.endDate);
    }

    // Apply additional filters to the outer query
    if (outerFilters) {
      searchQuery = searchQuery.replace(
        "WHERE (keyword_score > 0 OR semantic_score > 0.7 OR tag_score > 0)",
        `WHERE (keyword_score > 0 OR semantic_score > 0.7 OR tag_score > 0)${outerFilters}`
      );
    }

    // Add comprehensive scoring and sorting
    switch (sortBy) {
      case "relevance":
        const popularityWeight = includePopular
          ? "popularity_score * 0.05 +"
          : "";
        searchQuery += ` ORDER BY (
          keyword_score * 0.25 + 
          semantic_score * 0.35 + 
          tag_score * 0.15 + 
          importance_score * 0.1 + 
          ${popularityWeight}
          author_score * 0.05 + 
          recency_score * 0.05
        ) DESC`;
        break;

      case "importance":
        searchQuery += " ORDER BY importance DESC, updated_at DESC";
        break;

      case "recency":
        searchQuery += " ORDER BY updated_at DESC";
        break;

      case "popularity":
        searchQuery += " ORDER BY access_count DESC, updated_at DESC";
        break;

      default:
        searchQuery += " ORDER BY updated_at DESC";
    }

    searchQuery += ` LIMIT $${paramIndex}`;
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
