import { Request, Response } from "express";
import { pool } from "../config/database";
import { generateEmbedding } from "../services/embeddingService";
import { formatTags, parseTags } from "../utils/tagUtils";
import {
  AuthorRole,
  Memo,
  CreateMemoRequest,
  UpdateMemoRequest,
} from "../types";

export const createMemo = async (
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
      sessionId,
      content,
      summary,
      authorRole,
      importance = 1.0,
      tags,
    }: Omit<CreateMemoRequest, "userId"> = req.body;

    // Validate required fields (sessionId is now optional)
    if (!content || !authorRole) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Validate authorRole
    if (!Object.values(AuthorRole).includes(authorRole)) {
      res.status(400).json({ error: "Invalid author role" });
      return;
    }

    // Generate embedding for the content
    const embedding = await generateEmbedding(content);

    // Insert memo into database
    const query = `
      INSERT INTO memos (session_id, user_id, content, summary, author_role, importance, tags, embedding)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, session_id, user_id, content, summary, author_role, importance, access_count, tags, created_at, updated_at
    `;

    const values = [
      sessionId || null, // Allow null for optional sessionId
      userId,
      content,
      summary || null,
      authorRole,
      importance,
      formatTags(tags),
      JSON.stringify(embedding),
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];

    const memo: Memo = {
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
    };

    res.status(201).json(memo);
  } catch (error) {
    console.error("Error creating memo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMemos = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get userId from authenticated user (set by auth middleware)
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { sessionId, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT id, session_id, user_id, content, summary, author_role, importance, access_count, tags, created_at, updated_at
      FROM memos
      WHERE user_id = $1
    `;
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (sessionId) {
      query += ` AND session_id = $${paramIndex++}`;
      queryParams.push(sessionId);
    }

    query += ` ORDER BY updated_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    queryParams.push(Number(limit), Number(offset));

    const result = await pool.query(query, queryParams);

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
    console.error("Error fetching memos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMemoById = async (
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

    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      res.status(400).json({ error: "Invalid memo ID" });
      return;
    }

    // Get memo and increment access count, but only if it belongs to the authenticated user
    const query = `
      UPDATE memos 
      SET access_count = access_count + 1 
      WHERE id = $1 AND user_id = $2
      RETURNING id, session_id, user_id, content, summary, author_role, importance, access_count, tags, created_at, updated_at
    `;

    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Memo not found" });
      return;
    }

    const row = result.rows[0];
    const memo: Memo = {
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
    };

    res.json(memo);
  } catch (error) {
    console.error("Error fetching memo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateMemo = async (
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

    const { id } = req.params;
    const updates: UpdateMemoRequest = req.body;

    if (!id || isNaN(Number(id))) {
      res.status(400).json({ error: "Invalid memo ID" });
      return;
    }

    // Check if memo exists and belongs to the authenticated user
    const checkQuery =
      "SELECT content FROM memos WHERE id = $1 AND user_id = $2";
    const checkResult = await pool.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: "Memo not found" });
      return;
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updates.sessionId) {
      updateFields.push(`session_id = $${paramIndex++}`);
      updateValues.push(updates.sessionId);
    }

    // Note: Don't allow updating userId - it should always be the authenticated user

    if (updates.content) {
      updateFields.push(`content = $${paramIndex++}`);
      updateValues.push(updates.content);

      // Generate new embedding if content changed
      const embedding = await generateEmbedding(updates.content);
      updateFields.push(`embedding = $${paramIndex++}`);
      updateValues.push(JSON.stringify(embedding));
    }

    if (updates.summary !== undefined) {
      updateFields.push(`summary = $${paramIndex++}`);
      updateValues.push(updates.summary);
    }

    if (updates.authorRole) {
      if (!Object.values(AuthorRole).includes(updates.authorRole)) {
        res.status(400).json({ error: "Invalid author role" });
        return;
      }
      updateFields.push(`author_role = $${paramIndex++}`);
      updateValues.push(updates.authorRole);
    }

    if (updates.importance !== undefined) {
      updateFields.push(`importance = $${paramIndex++}`);
      updateValues.push(updates.importance);
    }

    if (updates.tags !== undefined) {
      updateFields.push(`tags = $${paramIndex++}`);
      updateValues.push(formatTags(updates.tags));
    }

    if (updateFields.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    // Add updated_at
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);
    updateValues.push(userId);

    const query = `
      UPDATE memos 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
      RETURNING id, session_id, user_id, content, summary, author_role, importance, access_count, tags, created_at, updated_at
    `;

    const result = await pool.query(query, updateValues);
    const row = result.rows[0];

    const memo: Memo = {
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
    };

    res.json(memo);
  } catch (error) {
    console.error("Error updating memo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMemo = async (
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

    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      res.status(400).json({ error: "Invalid memo ID" });
      return;
    }

    // Delete memo only if it belongs to the authenticated user
    const query =
      "DELETE FROM memos WHERE id = $1 AND user_id = $2 RETURNING id";
    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Memo not found" });
      return;
    }

    res.json({ message: "Memo deleted successfully" });
  } catch (error) {
    console.error("Error deleting memo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
