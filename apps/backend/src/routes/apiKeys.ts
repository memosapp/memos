import express, { Router } from "express";
import {
  createApiKey,
  getApiKeys,
  getApiKey,
  updateApiKey,
  deleteApiKey,
  getApiKeyStats,
  cleanupExpiredKeys,
  getApiKeyPermissions,
} from "../controllers/apiKeyController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router: Router = express.Router();

// All API key routes require authentication
router.use(requireAuth);

// Get available permissions (for frontend dropdowns)
router.get("/permissions", getApiKeyPermissions);

// Get user's API key statistics
router.get("/stats", getApiKeyStats);

// CRUD operations for API keys
router.post("/", createApiKey);
router.get("/", getApiKeys);
router.get("/:id", getApiKey);
router.put("/:id", updateApiKey);
router.delete("/:id", deleteApiKey);

// Admin-only operations
router.post("/cleanup", requireAdmin, cleanupExpiredKeys);

export default router;
