import { Router } from "express";
import {
  createMemo,
  getMemos,
  getMemoById,
  updateMemo,
  deleteMemo,
} from "../controllers/memoController";
import { requireAuth } from "../middleware/auth";

const router: Router = Router();

// All memo routes require authentication
router.post("/memo", requireAuth, createMemo);
router.get("/memos", requireAuth, getMemos);
router.get("/memo/:id", requireAuth, getMemoById);
router.patch("/memo/:id", requireAuth, updateMemo);
router.delete("/memo/:id", requireAuth, deleteMemo);

export default router;
