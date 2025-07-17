import { supabaseAdmin } from "../config/supabase";
import {
  generateQueryEmbedding,
  formatEmbeddingForPostgres,
} from "./embeddingService";

interface EmbeddingJob {
  job_id: number;
  memo_id: number;
  content: string;
}

export class BackgroundEmbeddingService {
  private isProcessing: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private processingInterval: number = 10000; // 10 seconds

  /**
   * Start the background processing service
   */
  public start(): void {
    if (this.intervalId) {
      console.log("Background embedding service is already running");
      return;
    }

    console.log("Starting background embedding service...");
    this.intervalId = setInterval(() => {
      this.processEmbeddingJobs();
    }, this.processingInterval);

    // Process immediately on start
    this.processEmbeddingJobs();
  }

  /**
   * Stop the background processing service
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Background embedding service stopped");
    }
  }

  /**
   * Process embedding jobs from the queue
   */
  private async processEmbeddingJobs(): Promise<void> {
    if (this.isProcessing) {
      console.log("Already processing embedding jobs, skipping this cycle");
      return;
    }

    this.isProcessing = true;

    try {
      // Get embedding jobs from the queue
      const { data: jobs, error } = await supabaseAdmin.rpc(
        "get_embedding_jobs",
        {
          batch_size: 10,
          timeout_seconds: 30,
        }
      );

      if (error) {
        console.error("Error fetching embedding jobs:", error);
        return;
      }

      if (!jobs || jobs.length === 0) {
        // No jobs to process
        return;
      }

      console.log(`Processing ${jobs.length} embedding jobs...`);

      // Process each job
      for (const job of jobs as EmbeddingJob[]) {
        await this.processEmbeddingJob(job);
      }

      console.log(`Completed processing ${jobs.length} embedding jobs`);
    } catch (error) {
      console.error("Error in background embedding processing:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single embedding job
   */
  private async processEmbeddingJob(job: EmbeddingJob): Promise<void> {
    try {
      console.log(
        `Processing embedding job ${job.job_id} for memo ${job.memo_id}`
      );

      if (!job.content || job.content.trim() === "") {
        console.warn(`Memo ${job.memo_id} has no content to embed`);
        await this.failJob(job.job_id);
        return;
      }

      // Generate embedding using Gemini
      const embedding = await generateQueryEmbedding(job.content);

      if (!embedding) {
        console.error(`Failed to generate embedding for memo ${job.memo_id}`);
        await this.failJob(job.job_id);
        return;
      }

      // Complete the job
      const { error } = await supabaseAdmin.rpc("complete_embedding_job", {
        job_id: job.job_id,
        memo_id: job.memo_id,
        embedding_vector: formatEmbeddingForPostgres(embedding),
      });

      if (error) {
        console.error(`Error completing embedding job ${job.job_id}:`, error);
        await this.failJob(job.job_id);
        return;
      }

      console.log(
        `Successfully completed embedding job ${job.job_id} for memo ${job.memo_id}`
      );
    } catch (error) {
      console.error(`Error processing embedding job ${job.job_id}:`, error);
      await this.failJob(job.job_id);
    }
  }

  /**
   * Mark a job as failed
   */
  private async failJob(jobId: number): Promise<void> {
    try {
      const { error } = await supabaseAdmin.rpc("fail_embedding_job", {
        job_id: jobId,
      });

      if (error) {
        console.error(`Error failing embedding job ${jobId}:`, error);
      }
    } catch (error) {
      console.error(`Error failing embedding job ${jobId}:`, error);
    }
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats(): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin.rpc(
        "get_embedding_queue_stats"
      );

      if (error) {
        console.error("Error fetching queue stats:", error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error("Error fetching queue stats:", error);
      return null;
    }
  }

  /**
   * Get current processing status
   */
  public getStatus(): {
    isRunning: boolean;
    isProcessing: boolean;
    processingInterval: number;
  } {
    return {
      isRunning: this.intervalId !== null,
      isProcessing: this.isProcessing,
      processingInterval: this.processingInterval,
    };
  }
}

// Export a singleton instance
export const backgroundEmbeddingService = new BackgroundEmbeddingService();
