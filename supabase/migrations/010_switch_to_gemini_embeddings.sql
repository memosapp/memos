-- Migration: Switch from Supabase Edge Functions to Gemini embeddings
-- Changes vector dimensions from 384 to 1536 for gemini-embedding-001

-- Step 1: Clear existing embeddings (they're incompatible with new dimensions)
UPDATE public.memos SET embedding = NULL;

-- Step 2: Drop existing vector indexes (they're dimension-specific)
DROP INDEX IF EXISTS idx_memos_embedding_hnsw;

-- Step 3: Change the embedding column to use 1536 dimensions
ALTER TABLE public.memos ALTER COLUMN embedding TYPE vector(1536);

-- Step 4: Recreate indexes for the new dimension
CREATE INDEX idx_memos_embedding_hnsw ON public.memos USING hnsw (embedding vector_cosine_ops);

-- Step 5: Update hybrid search function to use 1536 dimensions
DROP FUNCTION IF EXISTS search_memos_hybrid(text, vector, text, int, float, float, int);

CREATE OR REPLACE FUNCTION search_memos_hybrid(
  query_text text,
  query_embedding vector(1536),
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

-- Step 6: Drop old embedding generation functions that used 384 dimensions
DROP FUNCTION IF EXISTS generate_query_embedding(text);

-- Step 7: Update the process_embeddings function to use direct Gemini API calls
-- (The backend will handle embedding generation directly, no longer via Edge Functions)
DROP FUNCTION IF EXISTS util.process_embeddings(int, int, int);

-- Step 8: Remove the cron job that was processing Edge Function embeddings
SELECT cron.unschedule('process-embeddings');

-- Step 9: Clear the embedding queue (old jobs won't work with new system)
DELETE FROM pgmq.q_embedding_jobs;

-- Step 10: Grant permissions for the updated function
GRANT EXECUTE ON FUNCTION search_memos_hybrid(text, vector, text, int, float, float, int) TO authenticated;

-- Step 11: Queue fresh embedding jobs for all existing memos
DO $$
DECLARE
    memo_record RECORD;
BEGIN
    FOR memo_record IN 
        SELECT id FROM public.memos WHERE embedding IS NULL
    LOOP
        PERFORM pgmq.send(
            queue_name => 'embedding_jobs',
            msg => jsonb_build_object(
                'id', memo_record.id,
                'schema', 'public',
                'table', 'memos',
                'contentFunction', 'embedding_input', 
                'embeddingColumn', 'embedding'
            )
        );
    END LOOP;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION search_memos_hybrid IS 'Hybrid search function using Gemini 1536-dimensional embeddings';
COMMENT ON COLUMN public.memos.embedding IS '1536-dimensional vector embeddings from Gemini gemini-embedding-001 model';

SELECT 'Migration to Gemini embeddings completed successfully!' as status; 