-- Migration: Setup Gemini background processing
-- Creates a background job system that works with the Gemini API through the backend

-- Create a function that will be called by the backend to process embedding jobs
CREATE OR REPLACE FUNCTION util.get_embedding_jobs(
  batch_size int = 10,
  timeout_seconds int = 30
)
RETURNS TABLE (
  job_id bigint,
  memo_id int,
  content text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    msg.msg_id,
    (msg.message->>'id')::int as memo_id,
    COALESCE(embedding_input(m), '') as content
  FROM pgmq.read(
    queue_name => 'embedding_jobs',
    vt => timeout_seconds,
    qty => batch_size
  ) msg
  JOIN public.memos m ON m.id = (msg.message->>'id')::int
  WHERE m.embedding IS NULL;
END;
$$;

-- Create a function to mark embedding jobs as complete
CREATE OR REPLACE FUNCTION util.complete_embedding_job(
  job_id bigint,
  memo_id int,
  embedding_vector text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the memo with the embedding
  UPDATE public.memos 
  SET embedding = embedding_vector::vector(1536)
  WHERE id = memo_id;
  
  -- Delete the job from the queue
  PERFORM pgmq.delete('embedding_jobs', job_id);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Create a function to mark embedding jobs as failed
CREATE OR REPLACE FUNCTION util.fail_embedding_job(
  job_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the job from the queue (it will be retried later if needed)
  PERFORM pgmq.delete('embedding_jobs', job_id);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Create a function to get queue statistics
CREATE OR REPLACE FUNCTION util.get_embedding_queue_stats()
RETURNS TABLE (
  queue_name text,
  queue_length bigint,
  oldest_msg_age interval,
  newest_msg_age interval,
  total_messages bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'embedding_jobs'::text,
    pgmq.queue_length('embedding_jobs'),
    CASE 
      WHEN pgmq.queue_length('embedding_jobs') > 0 
      THEN NOW() - (SELECT MIN(enqueued_at) FROM pgmq.q_embedding_jobs)
      ELSE NULL
    END as oldest_msg_age,
    CASE 
      WHEN pgmq.queue_length('embedding_jobs') > 0 
      THEN NOW() - (SELECT MAX(enqueued_at) FROM pgmq.q_embedding_jobs)
      ELSE NULL
    END as newest_msg_age,
    (SELECT COUNT(*) FROM pgmq.q_embedding_jobs)::bigint as total_messages;
END;
$$;

-- Grant permissions for the backend to use these functions
GRANT EXECUTE ON FUNCTION util.get_embedding_jobs(int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION util.complete_embedding_job(bigint, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION util.fail_embedding_job(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION util.get_embedding_queue_stats() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION util.get_embedding_jobs IS 'Retrieves embedding jobs for the backend to process using Gemini API';
COMMENT ON FUNCTION util.complete_embedding_job IS 'Marks an embedding job as complete and updates the memo';
COMMENT ON FUNCTION util.fail_embedding_job IS 'Marks an embedding job as failed and removes it from queue';
COMMENT ON FUNCTION util.get_embedding_queue_stats IS 'Returns statistics about the embedding queue';

SELECT 'Gemini background processing setup completed successfully!' as status; 