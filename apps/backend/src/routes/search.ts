import { Router } from "express";
import { searchMemos } from "../controllers/memoController";
import { requireAuth } from "../middleware/auth";
import { searchRateLimit } from "../middleware/rateLimiter";

const router: Router = Router();

// Search route requires authentication and rate limiting
router.post("/search", searchRateLimit, requireAuth, searchMemos);

export default router;
