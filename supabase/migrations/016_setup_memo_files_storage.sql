-- Migration: Setup storage bucket for memo files
-- This migration creates the storage bucket and policies for memo file attachments

-- Create the memo-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memo-files',
  'memo-files',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create policy for authenticated users to upload files
CREATE POLICY "Users can upload memo files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'memo-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for authenticated users to view their own files
CREATE POLICY "Users can view their own memo files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'memo-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for authenticated users to delete their own files
CREATE POLICY "Users can delete their own memo files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'memo-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for public read access (since we're using public URLs)
CREATE POLICY "Public read access for memo files" ON storage.objects
FOR SELECT USING (bucket_id = 'memo-files');

-- Enable RLS on storage.objects (should already be enabled, but ensuring it)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 