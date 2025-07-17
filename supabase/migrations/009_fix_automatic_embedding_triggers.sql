-- Migration: Fix missing automatic embedding triggers
-- The trigger functions exist but the triggers themselves are missing

-- Drop any existing triggers first (in case they're partially there)
DROP TRIGGER IF EXISTS embed_memos_on_insert ON public.memos;
DROP TRIGGER IF EXISTS embed_memos_on_update ON public.memos;
DROP TRIGGER IF EXISTS clear_memo_embedding_on_update ON public.memos;

-- Create the automatic embedding triggers
CREATE TRIGGER embed_memos_on_insert
  AFTER INSERT
  ON public.memos
  FOR EACH ROW
  EXECUTE FUNCTION util.queue_embeddings('embedding_input', 'embedding');

CREATE TRIGGER embed_memos_on_update
  AFTER UPDATE OF content, summary -- only when content changes
  ON public.memos
  FOR EACH ROW
  EXECUTE FUNCTION util.queue_embeddings('embedding_input', 'embedding');

-- Optional: Clear embedding on update to ensure accuracy  
CREATE TRIGGER clear_memo_embedding_on_update
  BEFORE UPDATE OF content, summary
  ON public.memos
  FOR EACH ROW
  EXECUTE FUNCTION util.clear_column('embedding');

-- Clear the failed queue and add fresh jobs for existing memos
DELETE FROM pgmq.q_embedding_jobs WHERE read_ct > 0;

-- Queue new jobs for all memos without embeddings
DO $$
DECLARE
    memo_record RECORD;
BEGIN
    FOR memo_record IN 
        SELECT id FROM public.memos WHERE embedding IS NULL
    LOOP
        PERFORM pgmq.send(
            queue_name => 'embedding_jobs',
            msg => jsonb_build_object(
                'id', memo_record.id,
                'schema', 'public',
                'table', 'memos',
                'contentFunction', 'embedding_input', 
                'embeddingColumn', 'embedding'
            )
        );
    END LOOP;
END $$;

-- Verify triggers were created
SELECT 'Triggers created successfully!' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE event_object_table = 'memos' 
    AND trigger_name = 'embed_memos_on_insert'
); 