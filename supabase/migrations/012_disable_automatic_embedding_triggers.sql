-- Migration: Disable automatic embedding triggers
-- Since we're now generating embeddings manually during memo creation/updates

-- Drop the automatic embedding triggers
DROP TRIGGER IF EXISTS embed_memos_on_insert ON public.memos;
DROP TRIGGER IF EXISTS embed_memos_on_update ON public.memos;
DROP TRIGGER IF EXISTS clear_memo_embedding_on_update ON public.memos;

-- Clear the embedding queue since we no longer use background processing
DELETE FROM pgmq.q_embedding_jobs;

-- Add comment explaining the change
COMMENT ON TABLE public.memos IS 'Main table for storing chat history and memos with AI embeddings (embeddings generated manually during creation/updates)';

SELECT 'Automatic embedding triggers disabled - using manual generation' as status; 