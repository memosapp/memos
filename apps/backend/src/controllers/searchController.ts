import { Request, Response } from "express";
import { pool } from "../config/database";
import { generateEmbedding } from "../services/embeddingService";
import { parseTags, formatTags } from "../utils/tagUtils";
import { Memo, SearchRequest } from "../types";
import {
  generateCacheKey,
  getCachedSearchResults,
  cacheSearchResults,
} from "../services/searchCacheService";

export const searchMemos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get userId from authenticated user (set by auth middleware)
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const {
      query,
      sessionId,
      limit = 10,
      tags,
      authorRole,
      minImportance,
      maxImportance,
      sortBy = "relevance",
      includePopular = false,
      dateRange,
    }: Omit<SearchRequest, "userId"> = req.body;

    if (!query) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    // Validate query length for performance
    if (query.length < 2) {
      res
        .status(400)
        .json({ error: "Search query must be at least 2 characters long" });
      return;
    }

    if (query.length > 500) {
      res
        .status(400)
        .json({ error: "Search query is too long (max 500 characters)" });
      return;
    }

    // Generate cache key for this search
    const cacheKey = generateCacheKey(
      userId,
      query,
      sessionId,
      limit,
      tags,
      authorRole,
      minImportance,
      maxImportance,
      sortBy,
      includePopular
    );

    // Check cache first
    const cachedResults = getCachedSearchResults(cacheKey);
    if (cachedResults) {
      console.log("Returning cached search results");
      res.json(cachedResults);
      return;
    }

    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Build tag matching conditions
    let tagConditions = "";
    if (tags && tags.length > 0) {
      const tagMatches = tags
        .map((_, i) => `array_to_string(tags, ' ') ILIKE $${5 + i}`)
        .join(" OR ");
      tagConditions = `WHEN ${tagMatches} THEN 0.2`;
    } else {
      tagConditions = "WHEN FALSE THEN 0.2";
    }

    // Build the complex search query with hybrid scoring
    let searchQuery = `
      SELECT 
        id, session_id, user_id, content, summary, author_role, importance, access_count, tags, app_name, created_at, updated_at,
        (
          -- Keyword matching (40% weight) - more strict matching
          CASE 
            -- Exact word match gets full points
            WHEN content ~* ('\\y' || $3::text || '\\y') OR summary ~* ('\\y' || $3::text || '\\y') THEN 0.4
            -- Partial match gets reduced points
            WHEN content ILIKE $1 OR summary ILIKE $1 THEN 0.2
            ELSE 0
          END +
          
          -- Tag matching (20% weight)
          CASE 
            ${tagConditions}
            ELSE 0
          END +
          
          -- Vector similarity (30% weight) - only if similarity > 0.7
          CASE 
            WHEN (1 - (embedding <=> $2::vector)) > 0.7 THEN (1 - (embedding <=> $2::vector)) * 0.3
            ELSE 0
          END +
          
          -- Importance boost (10% weight) - reduced weight
          (importance * 0.1)
          
          ${includePopular ? "+ (access_count::float / 100.0) * 0.05" : ""}
        ) as relevance_score
      FROM memos
      WHERE user_id = $4
    `;

    // Add minimum relevance threshold as a subquery
    searchQuery = `
      SELECT * FROM (
        ${searchQuery}
      ) filtered_results
      WHERE relevance_score >= 0.15
    `;

    const queryParams: any[] = [
      `%${query}%`,
      JSON.stringify(queryEmbedding),
      query, // raw query for word boundary matching
      userId,
    ];
    let paramIndex = 5;

    // Add tag parameters
    if (tags && tags.length > 0) {
      tags.forEach((tag) => {
        queryParams.push(`%${tag}%`);
      });
      paramIndex += tags.length;
    }

    // Add additional filters
    if (sessionId) {
      searchQuery += ` AND session_id = $${paramIndex++}`;
      queryParams.push(sessionId);
    }

    if (authorRole) {
      searchQuery += ` AND author_role = $${paramIndex++}`;
      queryParams.push(authorRole);
    }

    if (minImportance !== undefined) {
      searchQuery += ` AND importance >= $${paramIndex++}`;
      queryParams.push(minImportance);
    }

    if (maxImportance !== undefined) {
      searchQuery += ` AND importance <= $${paramIndex++}`;
      queryParams.push(maxImportance);
    }

    if (dateRange) {
      if (dateRange.startDate) {
        searchQuery += ` AND created_at >= $${paramIndex++}`;
        queryParams.push(dateRange.startDate);
      }
      if (dateRange.endDate) {
        searchQuery += ` AND created_at <= $${paramIndex++}`;
        queryParams.push(dateRange.endDate);
      }
    }

    // Add sorting
    switch (sortBy) {
      case "importance":
        searchQuery += ` ORDER BY importance DESC, relevance_score DESC`;
        break;
      case "recency":
        searchQuery += ` ORDER BY created_at DESC`;
        break;
      case "popularity":
        searchQuery += ` ORDER BY access_count DESC, relevance_score DESC`;
        break;
      default:
        searchQuery += ` ORDER BY relevance_score DESC`;
    }

    searchQuery += ` LIMIT $${paramIndex}`;
    queryParams.push(Number(limit));

    console.log("Search query:", searchQuery);

    const result = await pool.query(searchQuery, queryParams);

    console.log(
      `Search completed: found ${result.rows.length} results for query "${query}"`
    );

    // Log relevance scores for debugging
    if (result.rows.length > 0) {
      const scores = result.rows
        .map((row) => row.relevance_score)
        .sort((a, b) => b - a);
      console.log(
        `Relevance scores: min=${scores[scores.length - 1]}, max=${
          scores[0]
        }, avg=${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(
          3
        )}`
      );
    }

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
      appName: row.app_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Cache the results for future use
    cacheSearchResults(cacheKey, memos);

    res.json(memos);
  } catch (error) {
    console.error("Error searching memos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
