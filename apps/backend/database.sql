-- Database setup for Memos project
-- This file contains the SQL commands to set up the database schema

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a custom type for author roles for data integrity
CREATE TYPE author_role_enum AS ENUM ('user', 'agent', 'system');

-- Create the main table for memos
CREATE TABLE memos (
    id SERIAL PRIMARY KEY,
    session_id TEXT, -- Made nullable since not all agents can supply it
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    author_role author_role_enum NOT NULL,
    importance REAL DEFAULT 1.0,
    access_count INTEGER DEFAULT 0,
    tags TEXT[],
    embedding VECTOR(3072), -- Gemini embeddings are 3072 dimensions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_memos_session_id ON memos(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_memos_user_id ON memos(user_id);
CREATE INDEX idx_memos_author_role ON memos(author_role);
CREATE INDEX idx_memos_created_at ON memos(created_at);
CREATE INDEX idx_memos_updated_at ON memos(updated_at);
CREATE INDEX idx_memos_importance ON memos(importance);
CREATE INDEX idx_memos_tags ON memos USING GIN(tags);

-- Create a vector index for semantic search
-- Note: Vector indexes in pgvector are limited to 2000 dimensions
-- Since Gemini embeddings are 3072 dimensions, we skip the index for now
-- Vector similarity search will still work, just without the performance optimization
-- CREATE INDEX idx_memos_embedding ON memos USING hnsw (embedding vector_cosine_ops);

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

-- Migration script to update existing database
-- If you have an existing database, run this to make session_id nullable:
-- ALTER TABLE memos ALTER COLUMN session_id DROP NOT NULL;
-- DROP INDEX IF EXISTS idx_memos_session_id;
-- CREATE INDEX idx_memos_session_id ON memos(session_id) WHERE session_id IS NOT NULL;

-- =============================================================================
-- API Keys Table - For secure API key management
-- =============================================================================

-- Create enum for API key permissions
CREATE TYPE api_key_permission_enum AS ENUM ('read', 'write', 'admin');

-- Create the API keys table
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(16) NOT NULL,
    permissions api_key_permission_enum[] NOT NULL DEFAULT '{read}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT api_keys_user_id_name_unique UNIQUE (user_id, name),
    CONSTRAINT api_keys_expires_at_check CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Create indexes for better performance
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_api_keys_created_at ON api_keys(created_at);
CREATE INDEX idx_api_keys_last_used_at ON api_keys(last_used_at) WHERE last_used_at IS NOT NULL;

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to clean up expired API keys
CREATE OR REPLACE FUNCTION cleanup_expired_api_keys()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM api_keys 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for API key information (excluding sensitive data)
CREATE VIEW api_keys_view AS
SELECT 
    id,
    user_id,
    name,
    key_prefix,
    permissions,
    is_active,
    last_used_at,
    usage_count,
    expires_at,
    created_at,
    updated_at,
    CASE 
        WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN true
        ELSE false
    END AS is_expired
FROM api_keys;

-- Add comments for documentation
COMMENT ON TABLE api_keys IS 'Stores API keys for user authentication with the MCP server';
COMMENT ON COLUMN api_keys.user_id IS 'Reference to Supabase user ID';
COMMENT ON COLUMN api_keys.name IS 'Human-readable name for the API key';
COMMENT ON COLUMN api_keys.key_hash IS 'Bcrypt hash of the API key (never store plaintext)';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 16 characters of the key for identification';
COMMENT ON COLUMN api_keys.permissions IS 'Array of permissions granted to this API key';
COMMENT ON COLUMN api_keys.is_active IS 'Whether the API key is currently active';
COMMENT ON COLUMN api_keys.last_used_at IS 'Timestamp of last API key usage';
COMMENT ON COLUMN api_keys.usage_count IS 'Number of times this API key has been used';
COMMENT ON COLUMN api_keys.expires_at IS 'Optional expiration timestamp for the API key'; 