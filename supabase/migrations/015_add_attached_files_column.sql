-- Migration: Add attached_files column to memos table
-- This migration adds support for multiple file attachments per memo

-- Add the attached_files column as JSONB to store array of file objects
ALTER TABLE public.memos 
ADD COLUMN attached_files JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance when filtering by attached files
CREATE INDEX idx_memos_attached_files ON public.memos USING GIN (attached_files) 
WHERE attached_files != '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.memos.attached_files IS 'JSON array of attached file objects with fileName, fileUrl, fileSize, fileMimeType, and uploadedAt';

-- Create a function to validate attached_files structure (optional, for data integrity)
CREATE OR REPLACE FUNCTION validate_attached_files(files JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if it's an array
  IF jsonb_typeof(files) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Check each file object structure
  FOR i IN 0..jsonb_array_length(files) - 1 LOOP
    IF NOT (
      files->i ? 'fileName' AND
      files->i ? 'fileUrl' AND
      files->i ? 'fileSize' AND
      files->i ? 'fileMimeType' AND
      files->i ? 'uploadedAt' AND
      jsonb_typeof(files->i->'fileName') = 'string' AND
      jsonb_typeof(files->i->'fileUrl') = 'string' AND
      jsonb_typeof(files->i->'fileSize') = 'number' AND
      jsonb_typeof(files->i->'fileMimeType') = 'string' AND
      jsonb_typeof(files->i->'uploadedAt') = 'string'
    ) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add check constraint to ensure attached_files follows the expected structure
ALTER TABLE public.memos 
ADD CONSTRAINT check_attached_files_structure 
CHECK (validate_attached_files(attached_files));

-- Grant permissions for RLS (Row Level Security)
-- The existing RLS policies should automatically cover the new column 