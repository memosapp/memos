-- Migration script to add app_name column to the memos table
-- This field will track the source of the memo content (e.g., "Gemini", "ChatGPT", "Manual")

BEGIN;

-- Add the app_name column
ALTER TABLE memos ADD COLUMN app_name TEXT;

-- Add an index for filtering by app_name
CREATE INDEX idx_memos_app_name ON memos(app_name) WHERE app_name IS NOT NULL;

-- Add a comment to document the purpose
COMMENT ON COLUMN memos.app_name IS 'Source application that created this memo (e.g., Gemini, ChatGPT, Manual)';

COMMIT; 