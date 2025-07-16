import { Router } from "express";
import {
  createMemo,
  getMemos,
  getMemoById,
  updateMemo,
  deleteMemo,
} from "../controllers/memoController";
import { requireAuth } from "../middleware/auth";
import { generalRateLimit } from "../middleware/rateLimiter";

const router: Router = Router();

// All memo routes require authentication and rate limiting
router.post("/memo", generalRateLimit, requireAuth, createMemo);
router.get("/memos", generalRateLimit, requireAuth, getMemos);
router.get("/memo/:id", generalRateLimit, requireAuth, getMemoById);
router.patch("/memo/:id", generalRateLimit, requireAuth, updateMemo);
router.delete("/memo/:id", generalRateLimit, requireAuth, deleteMemo);

export default router;
