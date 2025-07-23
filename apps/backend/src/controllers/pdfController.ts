import { Request, Response } from "express";
import {
  PDFProcessingService,
  UploadedFile,
} from "../services/pdfProcessingService";

interface MulterRequest extends Request {
  file?: UploadedFile;
}

export const processPDF = async (
  req: MulterRequest,
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

    // Process the PDF with Gemini
    try {
      const result = await PDFProcessingService.processPDF(file.buffer);

      console.log(
        `Successfully processed PDF: ${file.originalname} (${file.size} bytes)`
      );

      res.json({
        success: true,
        filename: file.originalname,
        size: file.size,
        ...result,
      });
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
