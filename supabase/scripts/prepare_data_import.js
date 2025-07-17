#!/usr/bin/env node

/**
 * Data preparation script for Supabase migration
 * This script processes the exported data to be compatible with Supabase
 */

const fs = require('fs');
const path = require('path');

const BACKUP_FILE = path.join(__dirname, '../backups/memos_data.sql');
const OUTPUT_FILE = path.join(__dirname, '../backups/memos_data_supabase.sql');

function prepareDataForSupabase() {
    console.log('📦 Preparing data for Supabase import...');
    
    try {
        // Read the exported data
        let sqlContent = fs.readFileSync(BACKUP_FILE, 'utf8');
        
        // Add header comment
        let processedContent = `-- Processed data for Supabase import
-- Generated on: ${new Date().toISOString()}
-- Source: ${BACKUP_FILE}

-- Temporarily disable RLS for data import
ALTER TABLE public.memos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys DISABLE ROW LEVEL SECURITY;

-- Import data
${sqlContent}

-- Re-enable RLS after import
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Verify import
SELECT 
    'memos' as table_name,
    count(*) as record_count
FROM public.memos
UNION ALL
SELECT 
    'api_keys' as table_name,
    count(*) as record_count  
FROM public.api_keys;

SELECT 'Data import completed successfully!' as status;
`;

        // Write the processed content
        fs.writeFileSync(OUTPUT_FILE, processedContent);
        
        console.log('✅ Data preparation completed!');
        console.log(`📄 Import file: ${OUTPUT_FILE}`);
        console.log('📋 Next steps:');
        console.log('   1. Review the generated SQL file');
        console.log('   2. Run it in Supabase SQL Editor');
        console.log('   3. Verify data import was successful');
        
    } catch (error) {
        console.error('❌ Error preparing data:', error.message);
        process.exit(1);
    }
}

// Check if backup file exists
if (!fs.existsSync(BACKUP_FILE)) {
    console.error(`❌ Backup file not found: ${BACKUP_FILE}`);
    console.log('📋 Please run the pg_dump command first to export your data');
    process.exit(1);
}

prepareDataForSupabase(); 