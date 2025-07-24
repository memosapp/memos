-- Migration: Setup storage bucket for memo files (Final Fixed Version)
-- This migration creates the storage bucket and policies for memo file attachments

-- Step 1: Create the memo-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memo-files',
  'memo-files',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload memo files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own memo files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own memo files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for memo files" ON storage.objects;

-- Step 3: Create storage policies using proper syntax for Supabase
-- Policy for authenticated users to upload files to their own folder
CREATE POLICY "Users can upload memo files"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'memo-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for authenticated users to view their own files
CREATE POLICY "Users can view their own memo files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'memo-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for authenticated users to delete their own files
CREATE POLICY "Users can delete their own memo files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'memo-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for public read access (needed for public URLs)
CREATE POLICY "Public read access for memo files"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'memo-files'); 