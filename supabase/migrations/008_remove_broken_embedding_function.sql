-- Migration: Remove broken SQL embedding function 
-- The embedding generation should use the Edge Function instead

-- Drop the broken function that was causing vector syntax errors
DROP FUNCTION IF EXISTS generate_query_embedding(text);

-- Add a comment explaining the proper approach
COMMENT ON SCHEMA public IS 'Embedding generation for search queries should use the /functions/v1/embed Edge Function, not SQL functions'; 