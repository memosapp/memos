import express, { Express, Request, Response } from "express";
import cors from "cors";
import { Pool } from "pg";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Type definitions
export enum AuthorRole {
  USER = "user",
  AGENT = "agent",
  SYSTEM = "system",
}

export interface Memo {
  id: number;
  sessionId: string;
  userId: string;
  content: string;
  summary?: string;
  authorRole: AuthorRole;
  importance?: number;
  accessCount?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMemoRequest {
  sessionId: string;
  userId: string;
  content: string;
  summary?: string;
  authorRole: AuthorRole;
  importance?: number;
  tags?: string[];
}

export interface UpdateMemoRequest {
  sessionId?: string;
  userId?: string;
  content?: string;
  summary?: string;
  authorRole?: AuthorRole;
  importance?: number;
  tags?: string[];
}

export interface SearchRequest {
  query: string;
  userId?: string;
  sessionId?: string;
  limit?: number;
}

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "memos_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

// Initialize Google Gemini AI
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// Helper function to generate embeddings
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await genAI.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });

    const embedding = response.embeddings?.[0]?.values;

    if (!embedding) {
      throw new Error("Failed to generate embedding - no values returned");
    }

    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

// Helper function to convert tags array to PostgreSQL format
function formatTags(tags?: string[]): string | null {
  if (!tags || tags.length === 0) return null;
  return `{${tags.map((tag) => `"${tag}"`).join(",")}}`;
}

// Helper function to parse tags from PostgreSQL format
function parseTags(tagsString: string | null): string[] {
  if (!tagsString) return [];
  // Remove curly braces and split by comma
  return tagsString
    .slice(1, -1)
    .split(",")
    .map((tag) => tag.replace(/"/g, ""));
}

// API Routes

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Create a new memo
app.post("/memo", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      sessionId,
      userId,
      content,
      summary,
      authorRole,
      importance = 1.0,
      tags,
    }: CreateMemoRequest = req.body;

    // Validate required fields
    if (!sessionId || !userId || !content || !authorRole) {
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
      sessionId,
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
});

// Get all memos
app.get("/memos", async (req: Request, res: Response) => {
  try {
    const { userId, sessionId, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT id, session_id, user_id, content, summary, author_role, importance, access_count, tags, created_at, updated_at
      FROM memos
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND user_id = $${paramIndex++}`;
      queryParams.push(userId);
    }

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
});

// Get a specific memo by ID
app.get("/memo/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      res.status(400).json({ error: "Invalid memo ID" });
      return;
    }

    // Get memo and increment access count
    const query = `
      UPDATE memos 
      SET access_count = access_count + 1 
      WHERE id = $1 
      RETURNING id, session_id, user_id, content, summary, author_role, importance, access_count, tags, created_at, updated_at
    `;

    const result = await pool.query(query, [id]);

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
});

// Update a memo
app.patch("/memo/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: UpdateMemoRequest = req.body;

    if (!id || isNaN(Number(id))) {
      res.status(400).json({ error: "Invalid memo ID" });
      return;
    }

    // Check if memo exists
    const checkQuery = "SELECT content FROM memos WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

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

    if (updates.userId) {
      updateFields.push(`user_id = $${paramIndex++}`);
      updateValues.push(updates.userId);
    }

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

    const query = `
      UPDATE memos 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramIndex}
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
});

// Delete a memo
app.delete("/memo/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      res.status(400).json({ error: "Invalid memo ID" });
      return;
    }

    const query = "DELETE FROM memos WHERE id = $1 RETURNING id";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Memo not found" });
      return;
    }

    res.json({ message: "Memo deleted successfully" });
  } catch (error) {
    console.error("Error deleting memo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search memos using hybrid search
app.post("/search", async (req: Request, res: Response): Promise<void> => {
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
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  pool.end(() => {
    console.log("Database connection closed");
    process.exit(0);
  });
});

export default app;
