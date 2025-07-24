import { genAI } from "../config/gemini";
import { Type } from "@google/genai";

export interface PDFProcessingResult {
  content: string;
  summary?: string;
  tags?: string[];
  appName: string;
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
   * Process a PDF file and extract memory content using Gemini's document understanding
   */
  static async processPDF(pdfBuffer: Buffer): Promise<PDFProcessingResult> {
    try {
      console.log(`Processing PDF with Gemini (${pdfBuffer.length} bytes)...`);

      // Convert PDF buffer to base64
      const base64Data = pdfBuffer.toString("base64");

      // Create the prompt for memory extraction
      const prompt = `Please analyze this PDF document and extract meaningful information that would be useful to remember. 

Extract the following:
1. Main content: A comprehensive summary of the key information, concepts, and insights from the document
2. Brief summary: A concise 1-2 sentence summary of what this document is about
3. Relevant tags: 3-5 tags that would help categorize and find this information later

Focus on extracting information that would be valuable to remember and reference later. Include key concepts, important details, and actionable insights.`;

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
                description: "Detailed content extracted from the document",
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

      return {
        content: parsed.content,
        summary: parsed.summary,
        tags: parsed.tags,
        appName: "Gemini",
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
