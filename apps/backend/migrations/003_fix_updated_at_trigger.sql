-- Migration: Fix updated_at trigger to ignore access tracking updates
-- This will prevent updated_at from being changed when only access_count and last_accessed_at are updated

-- Replace the existing trigger function with a smarter one
CREATE OR REPLACE FUNCTION update_updated_at_column()
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

-- The trigger itself remains the same - just the function logic changed
-- No need to recreate the trigger since we're just updating the function

-- Add a comment to document the change
COMMENT ON FUNCTION update_updated_at_column() IS 'Updates updated_at timestamp only when meaningful memo content changes, ignoring access tracking updates'; 