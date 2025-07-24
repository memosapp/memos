import { Request, Response } from "express";
import { supabase, supabaseAdmin } from "../config/supabase";
import { formatTags, parseTags } from "../utils/tagUtils";
import {
  generateQueryEmbedding,
  formatEmbeddingForPostgres,
  regenerateAllMissingEmbeddings,
} from "../services/embeddingService";
import {
  AuthorRole,
  Memo,
  CreateMemoRequest,
  UpdateMemoRequest,
} from "../types";

/**
 * Create a new memo using Supabase with immediate embedding generation
 */
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
      appName,
      attachedFiles,
    }: Omit<CreateMemoRequest, "userId"> = req.body;

    // Validate required fields
    if (!content || !authorRole) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Validate authorRole
    if (!Object.values(AuthorRole).includes(authorRole)) {
      res.status(400).json({ error: "Invalid author role" });
      return;
    }

    // Generate embedding immediately using Gemini
    console.log("Generating embedding for new memo...");
    const embeddingContent = `${summary || ""} ${content}`.trim();
    const embedding = await generateQueryEmbedding(embeddingContent);

    if (!embedding) {
      throw new Error("Failed to generate embedding");
    }

    // Insert memo into Supabase with embedding
    const { data, error } = await supabaseAdmin
      .from("memos")
      .insert({
        session_id: sessionId || null,
        user_id: userId,
        content,
        summary: summary || null,
        author_role: authorRole,
        importance,
        tags: formatTags(tags),
        app_name: appName || null,
        attached_files: attachedFiles || [],
        embedding: embedding ? formatEmbeddingForPostgres(embedding) : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      res.status(500).json({ error: "Failed to create memo" });
      return;
    }

    console.log(
      `Successfully created memo ${data.id}${
        embedding ? " with embedding" : " without embedding"
      }`
    );

    // Convert response to our Memo type
    const memo: Memo = {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      content: data.content,
      summary: data.summary,
      authorRole: data.author_role as AuthorRole,
      importance: data.importance,
      accessCount: data.access_count,
      tags: parseTags(data.tags),
      appName: data.app_name,
      attachedFiles: data.attached_files || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastAccessedAt: data.last_accessed_at,
    };

    res.status(201).json(memo);
  } catch (error) {
    console.error("Error creating memo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get memos for the authenticated user
 */
export const getMemos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const {
      sessionId,
      limit = 50,
      offset = 0,
      tags,
      authorRole,
      minImportance,
      maxImportance,
    } = req.query;

    // Build query
    let query = supabaseAdmin
      .from("memos")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    // Apply filters
    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    if (authorRole) {
      query = query.eq("author_role", authorRole);
    }

    if (minImportance) {
      query = query.gte("importance", Number(minImportance));
    }

    if (maxImportance) {
      query = query.lte("importance", Number(maxImportance));
    }

    if (tags && Array.isArray(tags)) {
      // Filter by tags (contains any of the specified tags)
      query = query.overlaps("tags", tags);
    }

    // Apply pagination
    query = query.range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error } = await query;

    if (error) {
      console.error("Supabase query error:", error);
      res.status(500).json({ error: "Failed to fetch memos" });
      return;
    }

    // Convert to our Memo type
    const memos: Memo[] = data.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      content: row.content,
      summary: row.summary,
      authorRole: row.author_role as AuthorRole,
      importance: row.importance,
      accessCount: row.access_count,
      tags: parseTags(row.tags),
      appName: row.app_name,
      attachedFiles: row.attached_files || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastAccessedAt: row.last_accessed_at,
    }));

    res.json(memos);
  } catch (error) {
    console.error("Error fetching memos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get a single memo by ID
 */
export const getMemo = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!id || isNaN(Number(id))) {
      res.status(400).json({ error: "Invalid memo ID" });
      return;
    }

    // Get memo and increment access count
    const { data, error } = await supabaseAdmin
      .from("memos")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "Memo not found" });
        return;
      }
      console.error("Supabase query error:", error);
      res.status(500).json({ error: "Failed to fetch memo" });
      return;
    }

    // Update access count and last accessed time
    await supabaseAdmin
      .from("memos")
      .update({
        access_count: data.access_count + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Convert to our Memo type
    const memo: Memo = {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      content: data.content,
      summary: data.summary,
      authorRole: data.author_role as AuthorRole,
      importance: data.importance,
      accessCount: data.access_count + 1, // Return updated count
      tags: parseTags(data.tags),
      appName: data.app_name,
      attachedFiles: data.attached_files || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastAccessedAt: new Date(), // Return updated time
    };

    res.json(memo);
  } catch (error) {
    console.error("Error fetching memo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Search memos using improved hybrid search with RRF
 */
export const searchMemos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const {
      query,
      limit = 10,
      sessionId,
      full_text_weight = 1.0,
      semantic_weight = 1.0,
      rrf_k = 50,
    } = req.body;

    if (!query) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    console.log(`Searching for: "${query}" with hybrid search`);

    // Generate embedding for the query using the same model as stored embeddings
    const queryEmbedding = await generateQueryEmbedding(query);

    if (!queryEmbedding) {
      res.status(500).json({ error: "Failed to generate query embedding" });
      return;
    }

    // Try to use the new hybrid search function if we have embeddings, otherwise fallback
    try {
      let data, error;

      if (queryEmbedding) {
        // Use the new hybrid search function with proper RRF and semantic threshold
        console.log(
          "Using advanced hybrid search with RRF and threshold filtering"
        );
        const result = await supabaseAdmin.rpc("search_memos_hybrid", {
          query_text: query,
          query_embedding: formatEmbeddingForPostgres(queryEmbedding),
          user_id_param: userId,
          match_count: Number(limit),
          full_text_weight: Number(full_text_weight),
          semantic_weight: Number(semantic_weight),
          rrf_k: Number(rrf_k),
          semantic_threshold: 0.7, // Filter out results with similarity < 70%
        });
        data = result.data;
        error = result.error;
      } else {
        // Fallback to old search function
        console.log("Using legacy search (no embeddings available)");
        const result = await supabaseAdmin.rpc("search_memos", {
          query_text: query,
          user_id_param: userId,
          similarity_threshold: 0.7,
          limit_param: Number(limit),
        });
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("Supabase search error:", error);
        res.status(500).json({ error: "Search failed" });
        return;
      }

      // Convert search results to our Memo type format
      const memos: Memo[] = (data || []).map((row: any) => ({
        id: row.id,
        sessionId: row.session_id,
        userId: row.user_id,
        content: row.content,
        summary: row.summary,
        authorRole: row.author_role as AuthorRole,
        importance: row.importance,
        accessCount: row.access_count,
        tags: parseTags(row.tags),
        appName: row.app_name,
        attachedFiles: row.attached_files || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastAccessedAt: row.last_accessed_at,
        // Note: relevance_score and rank_explanation are available but not part of the Memo type
      }));

      console.log(
        `Found ${memos.length} results for query: "${query}" using ${
          queryEmbedding ? "hybrid" : "legacy"
        } search`
      );

      res.json(memos);
    } catch (searchError) {
      console.error("Error with search:", searchError);
      res.status(500).json({ error: "Search failed" });
    }
  } catch (error) {
    console.error("Error searching memos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Update a memo with immediate embedding regeneration
 */
export const updateMemo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const updates: UpdateMemoRequest = req.body;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!id || isNaN(Number(id))) {
      res.status(400).json({ error: "Invalid memo ID" });
      return;
    }

    // Get existing memo to check for content changes
    const { data: existingMemo, error: checkError } = await supabaseAdmin
      .from("memos")
      .select("content, summary")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (checkError || !existingMemo) {
      res.status(404).json({ error: "Memo not found" });
      return;
    }

    // Build update object
    const updateData: any = {};

    if (updates.sessionId !== undefined) {
      updateData.session_id = updates.sessionId;
    }

    if (updates.content !== undefined) {
      updateData.content = updates.content;
    }

    if (updates.summary !== undefined) {
      updateData.summary = updates.summary;
    }

    if (updates.authorRole !== undefined) {
      if (!Object.values(AuthorRole).includes(updates.authorRole)) {
        res.status(400).json({ error: "Invalid author role" });
        return;
      }
      updateData.author_role = updates.authorRole;
    }

    if (updates.importance !== undefined) {
      updateData.importance = updates.importance;
    }

    if (updates.tags !== undefined) {
      updateData.tags = formatTags(updates.tags);
    }

    if (updates.appName !== undefined) {
      updateData.app_name = updates.appName;
    }

    if (updates.attachedFiles !== undefined) {
      updateData.attached_files = updates.attachedFiles;
    }

    // Check if content or summary changed - if so, regenerate embedding
    const contentChanged =
      updates.content !== undefined && updates.content !== existingMemo.content;
    const summaryChanged =
      updates.summary !== undefined && updates.summary !== existingMemo.summary;

    if (contentChanged || summaryChanged) {
      console.log(`Regenerating embedding for updated memo ${id}...`);

      // Get the new content for embedding
      const newContent =
        updates.content !== undefined ? updates.content : existingMemo.content;
      const newSummary =
        updates.summary !== undefined ? updates.summary : existingMemo.summary;
      const embeddingContent = `${newSummary || ""} ${newContent}`.trim();

      // Generate new embedding
      const embedding = await generateQueryEmbedding(embeddingContent);

      if (embedding) {
        updateData.embedding = formatEmbeddingForPostgres(embedding);
        console.log(`Generated new embedding for memo ${id}`);
      } else {
        console.warn(
          `Failed to generate embedding for updated memo ${id}, keeping existing embedding`
        );
      }
    }

    // Perform update
    const { data, error } = await supabaseAdmin
      .from("memos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      res.status(500).json({ error: "Failed to update memo" });
      return;
    }

    console.log(
      `Successfully updated memo ${data.id}${
        contentChanged || summaryChanged ? " with new embedding" : ""
      }`
    );

    // Convert to our Memo type
    const memo: Memo = {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      content: data.content,
      summary: data.summary,
      authorRole: data.author_role as AuthorRole,
      importance: data.importance,
      accessCount: data.access_count,
      tags: parseTags(data.tags),
      appName: data.app_name,
      attachedFiles: data.attached_files || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastAccessedAt: data.last_accessed_at,
    };

    res.json(memo);
  } catch (error) {
    console.error("Error updating memo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete a memo
 */
export const deleteMemo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!id || isNaN(Number(id))) {
      res.status(400).json({ error: "Invalid memo ID" });
      return;
    }

    // Delete memo (RLS will ensure user can only delete their own)
    const { error } = await supabaseAdmin
      .from("memos")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase delete error:", error);
      res.status(500).json({ error: "Failed to delete memo" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting memo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Regenerate embeddings for all memos missing embeddings
 * This is a maintenance endpoint to fix missing embeddings
 */
export const regenerateEmbeddings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    console.log(`User ${userId} triggered embedding regeneration`);

    const result = await regenerateAllMissingEmbeddings();

    res.json({
      message: "Embedding regeneration completed",
      ...result,
    });
  } catch (error) {
    console.error("Error regenerating embeddings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
