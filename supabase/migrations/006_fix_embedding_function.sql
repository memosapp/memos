-- Migration: Fix the query embedding function 
-- Use the correct Supabase AI function syntax

-- Drop the previous function if it exists
DROP FUNCTION IF EXISTS generate_query_embedding(text);

-- Create the corrected function using Supabase's vector function
CREATE OR REPLACE FUNCTION generate_query_embedding(
  input_text text
)
RETURNS vector(384)
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- Use Supabase's built-in vector function
  SELECT vector(input_text)::vector(384);
$$;

-- If the above doesn't work, try the edge function approach
-- CREATE OR REPLACE FUNCTION generate_query_embedding(
--   input_text text
-- )
-- RETURNS vector(384)
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- DECLARE
--   result jsonb;
--   embedding_array text;
-- BEGIN
--   -- Call the same edge function used for memo embeddings
--   SELECT net.http_post(
--     url := util.project_url() || '/functions/v1/embed',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'token'
--     ),
--     body := jsonb_build_array(
--       jsonb_build_object(
--         'jobId', 0,
--         'id', 0,
--         'schema', 'public',
--         'table', 'temp',
--         'contentFunction', 'direct_content',
--         'embeddingColumn', 'embedding',
--         'content', input_text
--       )
--     )
--   ) INTO result;
--   
--   -- Extract embedding from response
--   embedding_array := result->'completedJobs'->0->>'embedding';
--   
--   RETURN embedding_array::vector(384);
-- EXCEPTION
--   WHEN OTHERS THEN
--     RETURN NULL;
-- END;
-- $$;

-- Grant permission
GRANT EXECUTE ON FUNCTION generate_query_embedding(text) TO authenticated;

-- Test the function
-- SELECT generate_query_embedding('test query') as test_result; 