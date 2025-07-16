-- API Keys Table Migration
-- This migration creates a secure API keys table for user authentication

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