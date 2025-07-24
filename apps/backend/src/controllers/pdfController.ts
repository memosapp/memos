import { Request, Response } from "express";
import {
  PDFProcessingService,
  UploadedFile,
} from "../services/pdfProcessingService";
import { supabaseAdmin } from "../config/supabase";
import { formatTags } from "../utils/tagUtils";
import {
  generateQueryEmbedding,
  formatEmbeddingForPostgres,
} from "../services/embeddingService";
import { AuthorRole, Memo } from "../types";

export const processPDF = async (
  req: Request & { file?: UploadedFile },
  res: Response
): Promise<void> => {
  try {
    // Check if user is authenticated
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ error: "No PDF file uploaded" });
      return;
    }

    const file = req.file;

    try {
      // Validate the PDF file
      PDFProcessingService.validatePDF(file);
    } catch (validationError: any) {
      res.status(400).json({ error: validationError.message });
      return;
    }

    // Process the PDF with Gemini and upload to storage
    try {
      const result = await PDFProcessingService.processPDF(
        file.buffer,
        file.originalname,
        userId
      );

      console.log(
        `Successfully processed PDF: ${file.originalname} (${file.size} bytes)`
      );

      // Create memo with PDF content and attached file
      try {
        // Generate embedding for the content
        const embeddingContent = `${result.summary || ""} ${
          result.content
        }`.trim();
        const embedding = await generateQueryEmbedding(embeddingContent);

        // Insert memo into Supabase with attachment info
        const { data: memoData, error: memoError } = await supabaseAdmin
          .from("memos")
          .insert({
            user_id: userId,
            content: result.content,
            summary: result.summary || null,
            author_role: AuthorRole.USER,
            importance: 1.0,
            tags: formatTags(result.tags),
            app_name: result.appName,
            attached_files: result.attachedFile ? [result.attachedFile] : [],
            embedding: embedding ? formatEmbeddingForPostgres(embedding) : null,
          })
          .select()
          .single();

        if (memoError) {
          console.error("Error creating memo:", memoError);
          res
            .status(500)
            .json({ error: "Failed to create memo with PDF content" });
          return;
        }

        console.log(
          `Successfully created memo ${memoData.id} with PDF attachment`
        );

        // Return both processing result and created memo
        res.json({
          success: true,
          memo: {
            id: memoData.id,
            content: result.content,
            summary: result.summary,
            tags: result.tags,
            attachedFiles: result.attachedFile ? [result.attachedFile] : [],
            createdAt: memoData.created_at,
          },
          processingResult: result,
        });
      } catch (memoError: any) {
        console.error("Error creating memo:", memoError);
        res.status(500).json({
          error: "PDF processed but failed to create memo",
          details: memoError.message,
        });
        return;
      }
    } catch (processingError: any) {
      console.error("PDF processing error:", processingError);
      res.status(500).json({
        error: "Failed to process PDF",
        details: processingError.message,
      });
      return;
    }
  } catch (error: any) {
    console.error("PDF upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
