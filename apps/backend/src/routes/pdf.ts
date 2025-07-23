import { Router } from "express";
import multer from "multer";
import { processPDF } from "../controllers/pdfController";
import { requireAuth } from "../middleware/auth";
import { generalRateLimit } from "../middleware/rateLimiter";

const router: Router = Router();

// Configure multer for PDF uploads
// Store files in memory as buffers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit (matching Gemini's limit)
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// PDF processing route
router.post(
  "/pdf/process",
  generalRateLimit,
  requireAuth,
  upload.single("pdf"),
  processPDF
);

export default router;
