-- Alternative vector setup - run this manually in Supabase SQL Editor if migrations fail
-- This enables vector extension and creates a simple test table

-- Method 1: Try enabling vector in public schema
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Method 2: If Method 1 fails, try without schema specification  
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Test vector functionality
CREATE TEMP TABLE vector_test (
    id serial primary key,
    content text,
    embedding vector(384)
);

-- Insert test data
INSERT INTO vector_test (content, embedding) 
VALUES ('test', '[0.1,0.2,0.3]');

-- Test vector operations
SELECT 
    content,
    embedding,
    embedding <-> '[0.1,0.2,0.3]'::vector as distance
FROM vector_test;

-- Clean up
DROP TABLE vector_test;

-- If successful, you should see:
SELECT 'Vector extension is working correctly!' as status;

-- Now you can create your actual tables:
-- CREATE TABLE public.memos (
--     id SERIAL PRIMARY KEY,
--     content TEXT NOT NULL,
--     embedding vector(384)
-- ); 