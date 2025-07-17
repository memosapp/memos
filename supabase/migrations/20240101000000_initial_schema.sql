-- Initial migration: Convert existing memos schema to Supabase
-- Based on apps/backend/database.sql

-- Enable required extensions
-- Note: vector extension should be enabled without explicit schema in Supabase
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgmq;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS hstore WITH SCHEMA extensions;

-- Create custom types in public schema
CREATE TYPE public.author_role_enum AS ENUM ('user', 'agent', 'system');
CREATE TYPE public.api_key_permission_enum AS ENUM ('read', 'write', 'admin');

-- Create main memos table
CREATE TABLE public.memos (
    id SERIAL PRIMARY KEY,
    session_id TEXT,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    author_role public.author_role_enum NOT NULL,
    importance REAL DEFAULT 1.0,
    access_count INTEGER DEFAULT 0,
    tags TEXT[],
    app_name TEXT,
    embedding public.vector(384), -- Supabase gte-small embeddings are 384 dimensions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ
);

-- Create API keys table
CREATE TABLE public.api_keys (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(16) NOT NULL,
    permissions public.api_key_permission_enum[] NOT NULL DEFAULT '{read}',
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

-- Create indexes for memos table
CREATE INDEX idx_memos_session_id ON public.memos(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_memos_user_id ON public.memos(user_id);
CREATE INDEX idx_memos_author_role ON public.memos(author_role);
CREATE INDEX idx_memos_created_at ON public.memos(created_at);
CREATE INDEX idx_memos_updated_at ON public.memos(updated_at);
CREATE INDEX idx_memos_importance ON public.memos(importance);
CREATE INDEX idx_memos_tags ON public.memos USING GIN(tags);
CREATE INDEX idx_memos_app_name ON public.memos(app_name) WHERE app_name IS NOT NULL;
CREATE INDEX idx_memos_last_accessed_at ON public.memos(last_accessed_at) WHERE last_accessed_at IS NOT NULL;

-- Create indexes for API keys table
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_key_prefix ON public.api_keys(key_prefix);
CREATE INDEX idx_api_keys_is_active ON public.api_keys(is_active);
CREATE INDEX idx_api_keys_expires_at ON public.api_keys(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_api_keys_created_at ON public.api_keys(created_at);
CREATE INDEX idx_api_keys_last_used_at ON public.api_keys(last_used_at) WHERE last_used_at IS NOT NULL;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update updated_at if meaningful fields have changed
    -- Ignore changes to access_count and last_accessed_at
    IF (OLD.session_id IS DISTINCT FROM NEW.session_id) OR
       (OLD.content IS DISTINCT FROM NEW.content) OR
       (OLD.summary IS DISTINCT FROM NEW.summary) OR
       (OLD.author_role IS DISTINCT FROM NEW.author_role) OR
       (OLD.importance IS DISTINCT FROM NEW.importance) OR
       (OLD.tags IS DISTINCT FROM NEW.tags) OR
       (OLD.app_name IS DISTINCT FROM NEW.app_name) OR
       (OLD.embedding IS DISTINCT FROM NEW.embedding) THEN
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_memos_updated_at
    BEFORE UPDATE ON public.memos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create API key cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_api_keys()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.api_keys 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create views
CREATE VIEW public.memos_view AS
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
    app_name,
    created_at,
    updated_at,
    last_accessed_at
FROM public.memos
ORDER BY updated_at DESC;

CREATE VIEW public.api_keys_view AS
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
FROM public.api_keys;

-- Add comments for documentation
COMMENT ON TABLE public.memos IS 'Main table for storing chat history and memos with AI embeddings';
COMMENT ON COLUMN public.memos.embedding IS '384-dimensional vector embeddings from Supabase gte-small model';
COMMENT ON TABLE public.api_keys IS 'API keys for user authentication with the MCP server';
COMMENT ON COLUMN public.api_keys.key_hash IS 'Bcrypt hash of the API key (never store plaintext)';

-- Enable Row Level Security (we'll configure policies later)
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY; 