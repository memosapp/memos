-- Adjust search threshold to be more restrictive
-- Based on testing, similarities between unrelated content are around 0.5+
-- So we need a higher threshold to filter out unrelated results

-- Drop and recreate the search function with a higher default threshold
DROP FUNCTION IF EXISTS search_memos_hybrid(text, vector, text, integer, double precision, double precision, integer, double precision);

CREATE OR REPLACE FUNCTION search_memos_hybrid(
    query_text text,
    query_embedding vector(1536),
    user_id_param text,
    match_count integer DEFAULT 10,
    full_text_weight double precision DEFAULT 1.0,
    semantic_weight double precision DEFAULT 1.0,
    rrf_k integer DEFAULT 50,
    semantic_threshold double precision DEFAULT 0.7  -- INCREASED: minimum semantic similarity threshold
)
RETURNS TABLE (
    id integer,
    session_id text,
    user_id text,
    content text,
    summary text,
    author_role author_role_enum,
    importance real,
    access_count integer,
    tags text[],
    app_name text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    last_accessed_at timestamp with time zone,
    relevance_score real,
    rank_explanation text
)
LANGUAGE sql
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
    AND (1 - (m.embedding <=> query_embedding)) >= semantic_threshold  -- Apply threshold filter
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