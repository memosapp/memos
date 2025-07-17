-- Fix API key usage count updates
-- This migration creates a proper trigger function for the api_keys table
-- that allows usage_count and last_used_at to be updated without interfering

-- Drop the existing trigger that uses the wrong function
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON public.api_keys;

-- Create a new trigger function specifically for API keys
CREATE OR REPLACE FUNCTION public.update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update updated_at if meaningful fields have changed
    -- Allow usage_count and last_used_at to be updated without affecting updated_at
    IF (OLD.name IS DISTINCT FROM NEW.name) OR
       (OLD.permissions IS DISTINCT FROM NEW.permissions) OR
       (OLD.is_active IS DISTINCT FROM NEW.is_active) OR
       (OLD.expires_at IS DISTINCT FROM NEW.expires_at) THEN
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the new trigger with the correct function
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_api_keys_updated_at();

-- Add comment for documentation
COMMENT ON FUNCTION public.update_api_keys_updated_at() IS 'Updates updated_at only when meaningful API key fields change, allowing usage_count and last_used_at to be updated without affecting updated_at';
