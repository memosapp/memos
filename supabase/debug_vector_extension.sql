-- Debug script to check vector extension status
-- Run this in Supabase SQL Editor if you encounter vector issues

-- Check if vector extension exists and in which schema
SELECT 
    e.extname as extension_name,
    n.nspname as schema_name,
    e.extversion as version
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'vector';

-- Check available vector types
SELECT 
    t.typname as type_name,
    n.nspname as schema_name
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE t.typname LIKE '%vector%';

-- Test vector type accessibility
SELECT 'Testing vector type access...' as status;

-- Try to create a temporary test
DO $$
BEGIN
    -- Test if we can use the vector type
    EXECUTE 'CREATE TEMP TABLE test_vector_table (id int, vec extensions.vector(3))';
    RAISE NOTICE 'SUCCESS: Vector type is accessible as extensions.vector';
    DROP TABLE test_vector_table;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: %', SQLERRM;
        -- Try alternative approaches
        BEGIN
            EXECUTE 'CREATE TEMP TABLE test_vector_table2 (id int, vec vector(3))';
            RAISE NOTICE 'SUCCESS: Vector type is accessible as vector';
            DROP TABLE test_vector_table2;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'ERROR with vector: %', SQLERRM;
        END;
END $$;

SELECT 'Vector extension debug completed' as result; 