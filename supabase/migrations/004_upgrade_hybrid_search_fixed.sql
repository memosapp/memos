-- Migration: Upgrade to proper hybrid search with RRF (Safe version)
-- Based on Supabase's hybrid search best practices

-- Safely add full-text search column (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'memos' AND column_name = 'fts') THEN
    ALTER TABLE public.memos ADD COLUMN fts tsvector;
  END IF;
END $$;

-- Drop existing triggers if they exist (to avoid conflicts)
DROP TRIGGER IF EXISTS update_memos_fts_on_insert ON public.memos;
DROP TRIGGER IF EXISTS update_memos_fts_on_update ON public.memos;

-- Create function to update full-text search vector
CREATE OR REPLACE FUNCTION update_memo_fts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts := to_tsvector('english', 
    COALESCE(NEW.summary, '') || ' ' || 
    COALESCE(NEW.content, '') || ' ' || 
    COALESCE(array_to_string(NEW.tags, ' '), '') || ' ' ||
    COALESCE(NEW.app_name, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create triggers to automatically update fts column
CREATE TRIGGER update_memos_fts_on_insert
  BEFORE INSERT ON public.memos
  FOR EACH ROW
  EXECUTE FUNCTION update_memo_fts();

CREATE TRIGGER update_memos_fts_on_update
  BEFORE UPDATE OF content, summary, tags, app_name ON public.memos
  FOR EACH ROW
  EXECUTE FUNCTION update_memo_fts();

-- Populate existing records with fts values (update all records)
UPDATE public.memos 
SET fts = to_tsvector('english', 
  COALESCE(summary, '') || ' ' || 
  COALESCE(content, '') || ' ' || 
  COALESCE(array_to_string(tags, ' '), '') || ' ' ||
  COALESCE(app_name, '')
)
WHERE fts IS NULL OR fts = '';

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_memos_fts ON public.memos USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_memos_embedding_hnsw ON public.memos USING hnsw (embedding vector_cosine_ops);

-- Improved hybrid search function using Reciprocal Ranked Fusion (RRF)
CREATE OR REPLACE FUNCTION search_memos_hybrid(
  query_text text,
  query_embedding vector(384),
  user_id_param text,
  match_count int = 10,
  full_text_weight float = 1.0,
  semantic_weight float = 1.0,
  rrf_k int = 50
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
  relevance_score real,
  rank_explanation text
)
LANGUAGE sql
STABLE
AS $$
WITH full_text AS (
  SELECT
    m.id,
    ts_rank_cd(m.fts, websearch_to_tsquery('english', query_text)) as fts_rank,
    row_number() OVER (ORDER BY ts_rank_cd(m.fts, websearch_to_tsquery('english', query_text)) DESC) as fts_rank_ix
  FROM public.memos m
  WHERE m.user_id = user_id_param
    AND m.fts @@ websearch_to_tsquery('english', query_text)
  ORDER BY fts_rank DESC
  LIMIT LEAST(match_count * 2, 100)
),
semantic AS (
  SELECT
    m.id,
    1 - (m.embedding <=> query_embedding) as semantic_similarity,
    row_number() OVER (ORDER BY m.embedding <=> query_embedding ASC) as semantic_rank_ix
  FROM public.memos m
  WHERE m.user_id = user_id_param
    AND m.embedding IS NOT NULL
  ORDER BY m.embedding <=> query_embedding ASC
  LIMIT LEAST(match_count * 2, 100)
)
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
    COALESCE(1.0 / (rrf_k + full_text.fts_rank_ix), 0.0) * full_text_weight +
    COALESCE(1.0 / (rrf_k + semantic.semantic_rank_ix), 0.0) * semantic_weight
  ) as relevance_score,
  CASE
    WHEN full_text.fts_rank_ix IS NOT NULL AND semantic.semantic_rank_ix IS NOT NULL 
    THEN 'Both text and semantic match'
    WHEN full_text.fts_rank_ix IS NOT NULL 
    THEN 'Text match only'
    WHEN semantic.semantic_rank_ix IS NOT NULL 
    THEN 'Semantic match only'
    ELSE 'No match'
  END as rank_explanation
FROM full_text
FULL OUTER JOIN semantic ON full_text.id = semantic.id
JOIN public.memos m ON COALESCE(full_text.id, semantic.id) = m.id
ORDER BY relevance_score DESC
LIMIT match_count;
$$;

-- Keep the old function for backward compatibility but mark as deprecated
COMMENT ON FUNCTION search_memos(text, text, real, int) IS 'DEPRECATED: Use search_memos_hybrid instead. This function will be removed in a future version.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_memos_hybrid(text, vector, text, int, float, float, int) TO authenticated;

-- Show completion message
SELECT 'Hybrid search migration completed successfully!' as status; 