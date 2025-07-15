-- Database setup for Memos project
-- This file contains the SQL commands to set up the database schema

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a custom type for author roles for data integrity
CREATE TYPE author_role_enum AS ENUM ('user', 'agent', 'system');

-- Create the main table for memos
CREATE TABLE memos (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    author_role author_role_enum NOT NULL,
    importance REAL DEFAULT 1.0,
    access_count INTEGER DEFAULT 0,
    tags TEXT[],
    embedding VECTOR(768), -- Gemini embeddings are 768 dimensions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_memos_session_id ON memos(session_id);
CREATE INDEX idx_memos_user_id ON memos(user_id);
CREATE INDEX idx_memos_author_role ON memos(author_role);
CREATE INDEX idx_memos_created_at ON memos(created_at);
CREATE INDEX idx_memos_updated_at ON memos(updated_at);
CREATE INDEX idx_memos_importance ON memos(importance);
CREATE INDEX idx_memos_tags ON memos USING GIN(tags);

-- Create a vector index for semantic search (using HNSW algorithm)
CREATE INDEX idx_memos_embedding ON memos USING hnsw (embedding vector_cosine_ops);

-- A trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_memos_updated_at
    BEFORE UPDATE ON memos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for easier querying
CREATE VIEW memos_view AS
SELECT 
    id,
    session_id,
    user_id,
    content,
    summary,
    author_role,
    importance,
    access_count,
    tags,
    created_at,
    updated_at
FROM memos
ORDER BY updated_at DESC;

-- Example queries for testing

-- Insert a sample memo (note: you'll need to generate the embedding vector)
-- INSERT INTO memos (session_id, user_id, content, author_role, tags, embedding)
-- VALUES ('session_123', 'user_456', 'This is a test memo', 'user', ARRAY['test', 'sample'], '[0.1, 0.2, 0.3, ...]');

-- Search for memos by content
-- SELECT * FROM memos WHERE content ILIKE '%test%';

-- Search for memos by tags
-- SELECT * FROM memos WHERE tags @> ARRAY['test'];

-- Vector similarity search (example)
-- SELECT *, embedding <=> '[0.1, 0.2, 0.3, ...]' AS distance
-- FROM memos
-- ORDER BY distance
-- LIMIT 10; 