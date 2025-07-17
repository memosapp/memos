-- Migration: Add RPC function for generating query embeddings
-- This allows the backend to generate embeddings for search queries using the same model as memo embeddings

-- Create function to generate embeddings for search queries using Supabase AI
CREATE OR REPLACE FUNCTION generate_query_embedding(
  input_text text
)
RETURNS vector(384)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  embedding_result vector(384);
BEGIN
  -- Use Supabase AI to generate embedding (same as memo embeddings)
  -- This requires Supabase AI to be enabled on your project
  SELECT ai.embedding(
    input := input_text,
    model := 'gte-small'
  ) INTO embedding_result;
  
  RETURN embedding_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return null if embedding generation fails
    RETURN NULL;
END;
$$;

-- Grant permission to call this function
GRANT EXECUTE ON FUNCTION generate_query_embedding(text) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION generate_query_embedding IS 'Generate 384-dimensional embedding for search queries using Supabase AI gte-small model';

-- Test function (optional - you can remove this after testing)
-- SELECT generate_query_embedding('test query') as test_embedding; 