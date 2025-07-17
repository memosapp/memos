// Supabase Edge Function for generating embeddings using native AI
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { z } from "npm:zod";

// Initialize the AI session for embeddings
const model = new Supabase.ai.Session("gte-small");

// Initialize Supabase client for database operations
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Job schema validation
const jobSchema = z.object({
  jobId: z.number(),
  id: z.number(),
  schema: z.string(),
  table: z.string(),
  contentFunction: z.string(),
  embeddingColumn: z.string(),
});

const failedJobSchema = jobSchema.extend({
  error: z.string(),
});

type Job = z.infer<typeof jobSchema>;
type FailedJob = z.infer<typeof failedJobSchema>;

const QUEUE_NAME = "embedding_jobs";

// Main function handler
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Expected POST request", { status: 405 });
  }

  if (req.headers.get("content-type") !== "application/json") {
    return new Response("Expected JSON body", { status: 400 });
  }

  // Parse and validate request body
  const parseResult = z.array(jobSchema).safeParse(await req.json());

  if (parseResult.error) {
    return new Response(`Invalid request body: ${parseResult.error.message}`, {
      status: 400,
    });
  }

  const pendingJobs = parseResult.data;
  const completedJobs: Job[] = [];
  const failedJobs: FailedJob[] = [];

  // Process each job
  for (const job of pendingJobs) {
    try {
      await processJob(job);
      completedJobs.push(job);
    } catch (error) {
      failedJobs.push({
        ...job,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      });
    }
  }

  // Log results
  console.log("Embedding jobs processed:", {
    completed: completedJobs.length,
    failed: failedJobs.length,
  });

  return new Response(
    JSON.stringify({
      completedJobs,
      failedJobs,
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-completed-jobs": completedJobs.length.toString(),
        "x-failed-jobs": failedJobs.length.toString(),
      },
    }
  );
});

/**
 * Process a single embedding job
 */
async function processJob(job: Job) {
  const { jobId, id, schema, table, contentFunction, embeddingColumn } = job;

  // Fetch the content using the specified content function
  const { data: rows, error: fetchError } = await supabase.rpc(
    "get_content_for_embedding",
    {
      table_name: table,
      content_function: contentFunction,
      record_id: id,
    }
  );

  if (fetchError) {
    throw new Error(`Failed to fetch content: ${fetchError.message}`);
  }

  if (!rows || rows.length === 0) {
    throw new Error(`No content found for ${schema}.${table}/${id}`);
  }

  const content = rows[0]?.content;
  if (typeof content !== "string") {
    throw new Error(`Invalid content type for ${schema}.${table}/${id}`);
  }

  // Generate embedding using Supabase AI
  const embedding = await model.run(content, {
    mean_pool: true,
    normalize: true,
  });

  // Update the record with the new embedding
  const { error: updateError } = await supabase
    .from(table)
    .update({ [embeddingColumn]: JSON.stringify(embedding) })
    .eq("id", id);

  if (updateError) {
    throw new Error(`Failed to update embedding: ${updateError.message}`);
  }

  // Remove the job from the queue
  const { error: deleteError } = await supabase.rpc("pgmq_delete", {
    queue_name: QUEUE_NAME,
    msg_id: jobId,
  });

  if (deleteError) {
    console.warn(
      `Failed to delete job ${jobId} from queue:`,
      deleteError.message
    );
  }
}
