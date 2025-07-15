import { Router } from "express";
import {
  createMemo,
  getMemos,
  getMemoById,
  updateMemo,
  deleteMemo,
} from "../controllers/memoController";

const router: Router = Router();

router.post("/memo", createMemo);
router.get("/memos", getMemos);
router.get("/memo/:id", getMemoById);
router.patch("/memo/:id", updateMemo);
router.delete("/memo/:id", deleteMemo);

export default router;
