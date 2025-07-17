-- Reset script to clean up failed migration attempts
-- Run this in Supabase SQL Editor if you need to start over

-- Drop tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.memos CASCADE;

-- Drop views if they exist
DROP VIEW IF EXISTS public.api_keys_view;
DROP VIEW IF EXISTS public.memos_view;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS public.cleanup_expired_api_keys();
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS public.api_key_permission_enum CASCADE;
DROP TYPE IF EXISTS public.author_role_enum CASCADE;

-- Note: Extensions are shared and should not be dropped unless you're sure
-- DROP EXTENSION IF EXISTS vector CASCADE;
-- DROP EXTENSION IF EXISTS pgmq CASCADE;
-- DROP EXTENSION IF EXISTS pg_net CASCADE;
-- DROP EXTENSION IF EXISTS pg_cron CASCADE;
-- DROP EXTENSION IF EXISTS hstore CASCADE;

SELECT 'Migration reset completed. You can now run supabase db push again.' as status; 