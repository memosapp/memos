-- Migration script to make session_id nullable in existing databases
-- Run this script if you have an existing database that needs to be updated

BEGIN;

-- Make session_id nullable
ALTER TABLE memos ALTER COLUMN session_id DROP NOT NULL;

-- Drop the old index and create a new one that handles null values
DROP INDEX IF EXISTS idx_memos_session_id;
CREATE INDEX idx_memos_session_id ON memos(session_id) WHERE session_id IS NOT NULL;

COMMIT; 