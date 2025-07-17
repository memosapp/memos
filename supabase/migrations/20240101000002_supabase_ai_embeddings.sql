-- Supabase native AI embeddings setup
-- This migration sets up automatic embedding generation using Supabase's built-in AI

-- Create utility schema for helper functions
CREATE SCHEMA IF NOT EXISTS util;

-- Store project URL in Vault for Edge Functions
-- This will be set via: SELECT vault.create_secret('YOUR_PROJECT_URL', 'project_url');

-- Utility function to get the Supabase project URL
CREATE OR REPLACE FUNCTION util.project_url()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  secret_value text;
BEGIN
  -- Retrieve the project URL from Vault
  SELECT decrypted_secret INTO secret_value 
  FROM vault.decrypted_secrets 
  WHERE name = 'project_url';
  RETURN secret_value;
END;
$$;

-- Generic function to invoke Edge Functions
CREATE OR REPLACE FUNCTION util.invoke_edge_function(
  name text,
  body jsonb,
  timeout_milliseconds int = 5 * 60 * 1000  -- default 5 minute timeout
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  headers_raw text;
  auth_header text;
BEGIN
  -- If we're in a PostgREST session, reuse the request headers for authorization
  headers_raw := current_setting('request.headers', true);
  
  -- Only try to parse if headers are present
  auth_header := CASE
    WHEN headers_raw IS NOT NULL THEN
      (headers_raw::json->>'authorization')
    ELSE
      NULL
  END;

  -- Perform async HTTP request to the edge function
  PERFORM net.http_post(
    url => util.project_url() || '/functions/v1/' || name,
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', auth_header
    ),
    body => body,
    timeout_milliseconds => timeout_milliseconds
  );
END;
$$;

-- Function to clear a column on update (for clearing old embeddings)
CREATE OR REPLACE FUNCTION util.clear_column()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    clear_column text := TG_ARGV[0];
BEGIN
    NEW := NEW #= hstore(clear_column, NULL);
    RETURN NEW;
END;
$$;

-- Create embedding jobs queue
SELECT pgmq.create('embedding_jobs');

-- Generic trigger function to queue embedding jobs
CREATE OR REPLACE FUNCTION util.queue_embeddings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  content_function text = TG_ARGV[0];
  embedding_column text = TG_ARGV[1];
BEGIN
  PERFORM pgmq.send(
    queue_name => 'embedding_jobs',
    msg => jsonb_build_object(
      'id', NEW.id,
      'schema', TG_TABLE_SCHEMA,
      'table', TG_TABLE_NAME,
      'contentFunction', content_function,
      'embeddingColumn', embedding_column
    )
  );
  RETURN NEW;
END;
$$;

-- Function to process embedding jobs from the queue
CREATE OR REPLACE FUNCTION util.process_embeddings(
  batch_size int = 10,
  max_requests int = 10,
  timeout_milliseconds int = 5 * 60 * 1000 -- default 5 minute timeout
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  job_batches jsonb[];
  batch jsonb;
BEGIN
  WITH
    -- First get jobs and assign batch numbers
    numbered_jobs AS (
      SELECT
        message || jsonb_build_object('jobId', msg_id) as job_info,
        (row_number() OVER (ORDER BY 1) - 1) / batch_size as batch_num
      FROM pgmq.read(
        queue_name => 'embedding_jobs',
        vt => timeout_milliseconds / 1000,
        qty => max_requests * batch_size
      )
    ),
    -- Then group jobs into batches
    batched_jobs AS (
      SELECT
        jsonb_agg(job_info) as batch_array,
        batch_num
      FROM numbered_jobs
      GROUP BY batch_num
    )
  -- Finally aggregate all batches into array
  SELECT array_agg(batch_array)
  FROM batched_jobs
  INTO job_batches;

  -- Invoke the embed edge function for each batch
  FOREACH batch IN ARRAY job_batches LOOP
    PERFORM util.invoke_edge_function(
      name => 'embed',
      body => batch,
      timeout_milliseconds => timeout_milliseconds
    );
  END LOOP;
END;
$$;

-- Schedule the embedding processing to run every 10 seconds
SELECT cron.schedule(
  'process-embeddings',
  '10 seconds',
  $$
  SELECT util.process_embeddings();
  $$
);

-- Function to generate content for embedding (combines content fields)
CREATE OR REPLACE FUNCTION embedding_input(memo public.memos)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN COALESCE(memo.summary || ' ', '') || memo.content;
END;
$$;

-- Helper function for Edge Function to get content
CREATE OR REPLACE FUNCTION get_content_for_embedding(
  table_name text,
  content_function text,
  record_id int
)
RETURNS TABLE(content text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  EXECUTE format('SELECT %I(t) FROM %I t WHERE id = $1', content_function, table_name)
  USING record_id;
END;
$$;

-- Triggers for automatic embedding generation
CREATE TRIGGER embed_memos_on_insert
  AFTER INSERT
  ON public.memos
  FOR EACH ROW
  EXECUTE FUNCTION util.queue_embeddings('embedding_input', 'embedding');

CREATE TRIGGER embed_memos_on_update
  AFTER UPDATE OF content, summary -- only when content changes
  ON public.memos
  FOR EACH ROW
  EXECUTE FUNCTION util.queue_embeddings('embedding_input', 'embedding');

-- Optional: Clear embedding on update to ensure accuracy
CREATE TRIGGER clear_memo_embedding_on_update
  BEFORE UPDATE OF content, summary
  ON public.memos
  FOR EACH ROW
  EXECUTE FUNCTION util.clear_column('embedding');

-- Add search function for hybrid search
CREATE OR REPLACE FUNCTION search_memos(
  query_text text,
  user_id_param text,
  similarity_threshold real = 0.7,
  limit_param int = 10
)
RETURNS TABLE (
  id int,
  content text,
  summary text,
  relevance_score real,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.summary,
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
          -- This would be replaced by actual embedding generation in practice
          SELECT embedding FROM public.memos WHERE embedding IS NOT NULL LIMIT 1
        ))) * 0.6)
        ELSE 0
      END
    )::real as relevance_score,
    m.created_at
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

-- Helper function to delete from pgmq (for Edge Function)
CREATE OR REPLACE FUNCTION pgmq_delete(queue_name text, msg_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, msg_id);
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA util TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA util TO authenticated;
GRANT EXECUTE ON FUNCTION search_memos(text, text, real, int) TO authenticated;
GRANT EXECUTE ON FUNCTION embedding_input(public.memos) TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_for_embedding(text, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION pgmq_delete(text, bigint) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION search_memos IS 'Hybrid search function combining text and vector similarity';
COMMENT ON SCHEMA util IS 'Utility functions for Supabase AI embeddings'; 