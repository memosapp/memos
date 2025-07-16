import { Router } from "express";
import { aiAssistance } from "../controllers/aiAssistanceController";
import { requireAuth } from "../middleware/auth";
import { aiRateLimit } from "../middleware/rateLimiter";

const router: Router = Router();

// AI assistance route requires authentication and rate limiting
router.post("/ai/assistance", aiRateLimit, requireAuth, aiAssistance);

export default router;
