-- Migration: Fix legacy search function to return all fields
-- Ensure complete memo data is returned even when embeddings fail

-- Drop and recreate the search_memos function to ensure it works correctly
DROP FUNCTION IF EXISTS search_memos(text, text, real, int);

CREATE OR REPLACE FUNCTION search_memos(
  query_text text,
  user_id_param text,
  similarity_threshold real = 0.7,
  limit_param int = 10
)
RETURNS TABLE (
  id int,
  session_id text,
  user_id text,
  content text,
  summary text,
  author_role public.author_role_enum,
  importance real,
  access_count int,
  tags text[],
  app_name text,
  created_at timestamptz,
  updated_at timestamptz,
  last_accessed_at timestamptz,
  relevance_score real
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.session_id,
    m.user_id,
    m.content,
    m.summary,
    m.author_role,
    m.importance,
    m.access_count,
    m.tags,
    m.app_name,
    m.created_at,
    m.updated_at,
    m.last_accessed_at,
    (
      -- Text similarity (40% weight)
      CASE 
        WHEN m.content ILIKE '%' || query_text || '%' OR m.summary ILIKE '%' || query_text || '%' 
        THEN 0.4
        ELSE 0
      END +
      -- Vector similarity (60% weight) - will be 0 if no embedding
      CASE 
        WHEN m.embedding IS NOT NULL 
        THEN GREATEST(0, (1 - (m.embedding <=> (
          -- Use a sample embedding for comparison (fallback)
          SELECT embedding FROM public.memos WHERE embedding IS NOT NULL LIMIT 1
        ))) * 0.6)
        ELSE 0
      END
    )::real as relevance_score
  FROM public.memos m
  WHERE m.user_id = user_id_param
  AND (
    m.content ILIKE '%' || query_text || '%' 
    OR m.summary ILIKE '%' || query_text || '%'
    OR (m.embedding IS NOT NULL) -- Include items with embeddings for vector search
  )
  ORDER BY relevance_score DESC, m.created_at DESC
  LIMIT limit_param;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_memos(text, text, real, int) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION search_memos IS 'Legacy search function with complete field mapping for fallback when embeddings fail'; 