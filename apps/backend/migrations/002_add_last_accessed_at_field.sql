-- Migration: Add last_accessed_at field to memos table
-- This field will track when a memo was last accessed (read), separate from updated_at

-- Add the last_accessed_at field
ALTER TABLE memos ADD COLUMN last_accessed_at TIMESTAMPTZ;

-- Create an index for better query performance
CREATE INDEX idx_memos_last_accessed_at ON memos(last_accessed_at) WHERE last_accessed_at IS NOT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN memos.last_accessed_at IS 'Timestamp of when this memo was last accessed/read'; 