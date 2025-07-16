-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create policy to allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow public access to view avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Alternative simpler policies (if the above don't work)
-- These are more permissive but simpler to set up

-- Allow authenticated users to upload to avatars bucket
-- CREATE POLICY "Authenticated users can upload avatars"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'avatars' AND
--   auth.role() = 'authenticated'
-- );

-- Allow authenticated users to update avatars
-- CREATE POLICY "Authenticated users can update avatars"
-- ON storage.objects FOR UPDATE
-- USING (
--   bucket_id = 'avatars' AND
--   auth.role() = 'authenticated'
-- );

-- Allow authenticated users to delete avatars
-- CREATE POLICY "Authenticated users can delete avatars"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'avatars' AND
--   auth.role() = 'authenticated'
-- );

-- Allow public read access to avatars
-- CREATE POLICY "Public access to avatars"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'avatars'); 