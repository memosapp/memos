import { genAI } from "../config/gemini";
import { Type } from "@google/genai";
import { supabaseAdmin } from "../config/supabase";
import { AttachedFile } from "../types";

export interface PDFProcessingResult {
  content: string;
  summary?: string;
  tags?: string[];
  appName: string;
  attachedFile: AttachedFile;
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class PDFProcessingService {
  /**
   * Sanitize filename for Supabase storage (remove non-ASCII characters and ensure URL safety)
   */
  private static sanitizeFilename(filename: string): string {
    // Remove file extension
    const ext = filename.split(".").pop() || "";
    const nameWithoutExt = filename.replace(`.${ext}`, "");

    // Replace non-ASCII characters and special characters with safe alternatives
    const sanitized = nameWithoutExt
      .normalize("NFD") // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, "") // Remove accent marks
      .replace(/[^\w\s-]/g, "") // Remove special characters except word chars, spaces, hyphens
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .replace(/_+/g, "_") // Replace multiple underscores with single
      .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
      .toLowerCase();

    // If sanitization resulted in empty string, use a default name
    const finalName = sanitized || "document";

    return `${finalName}.${ext}`;
  }

  /**
   * Process a PDF file and extract memory content using Gemini's document understanding
   */
  static async processPDF(
    pdfBuffer: Buffer,
    originalFileName: string,
    userId: string
  ): Promise<PDFProcessingResult> {
    try {
      console.log(`Processing PDF with Gemini (${pdfBuffer.length} bytes)...`);

      // Convert PDF buffer to base64
      const base64Data = pdfBuffer.toString("base64");

      // Create the prompt for memory extraction
      const prompt = `Please analyze this PDF document and extract meaningful information that would be useful to remember. 

Extract the following:
1. Main content: Extract the FULL CONTEXT and comprehensive details from the document. Include all important information, key concepts, data points, insights, and actionable details. Preserve the structure and hierarchy of information. Do not summarize - capture the complete context that someone would need to understand and reference this document fully.
2. Brief summary: A concise 1-2 sentence summary of what this document is about
3. Relevant tags: 3-5 tags that would help categorize and find this information later

Focus on capturing ALL valuable information that would be worth remembering and referencing later. The main content should be comprehensive and detailed, preserving the full context of the original document.`;

      // Prepare the content for Gemini
      const contents = [
        { text: prompt },
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data,
          },
        },
      ];

      // Generate content using Gemini with structured output
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: {
                type: Type.STRING,
                description:
                  "Full context and comprehensive details from the document, including all important information, concepts, and insights",
              },
              summary: {
                type: Type.STRING,
                description: "Brief summary of the document",
              },
              tags: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: "3-5 relevant tags for categorization",
              },
            },
            propertyOrdering: ["content", "summary", "tags"],
            required: ["content", "summary", "tags"],
          },
        },
      });

      const responseText = response.text;

      if (!responseText) {
        throw new Error("Gemini returned empty response");
      }

      console.log("Gemini PDF processing response received");

      // Parse the structured JSON response
      const parsed = JSON.parse(responseText);

      console.log("Parsed response:", parsed);

      // Upload PDF to Supabase storage
      const sanitizedFileName = this.sanitizeFilename(originalFileName);
      const fileName = `${userId}/pdfs/${Date.now()}_${sanitizedFileName}`;

      console.log(`Uploading PDF to Supabase storage: ${fileName}`);
      console.log(
        `Original filename: "${originalFileName}" -> Sanitized: "${sanitizedFileName}"`
      );

      const { data: uploadData, error: uploadError } =
        await supabaseAdmin.storage
          .from("memo-files")
          .upload(fileName, pdfBuffer, {
            contentType: "application/pdf",
            cacheControl: "3600",
            upsert: true,
          });

      if (uploadError) {
        console.error("Error uploading PDF to storage:", uploadError);
        throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      }

      // Get public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from("memo-files").getPublicUrl(fileName);

      console.log(`PDF uploaded successfully: ${publicUrl}`);

      // Create attached file object
      const attachedFile: AttachedFile = {
        fileName: originalFileName,
        fileUrl: publicUrl,
        fileSize: pdfBuffer.length,
        fileMimeType: "application/pdf",
        uploadedAt: new Date(),
      };

      return {
        content: parsed.content,
        summary: parsed.summary,
        tags: parsed.tags,
        appName: "Gemini",
        attachedFile,
      };
    } catch (error) {
      console.error("Error processing PDF with Gemini:", error);
      throw new Error("Failed to process PDF document");
    }
  }

  /**
   * Validate PDF file constraints
   */
  static validatePDF(file: UploadedFile): void {
    // Check file type
    if (file.mimetype !== "application/pdf") {
      throw new Error("Only PDF files are supported");
    }

    // Check file size (20MB limit as per Gemini docs)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      throw new Error("PDF file size must be less than 20MB");
    }

    // Check if file has content
    if (file.size === 0) {
      throw new Error("PDF file is empty");
    }
  }
}
