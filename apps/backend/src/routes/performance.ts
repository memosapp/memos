import { Router } from "express";
import { getPerformanceStats } from "../controllers/performanceController";
import { requireAuth } from "../middleware/auth";
import { generalRateLimit } from "../middleware/rateLimiter";

const router: Router = Router();

// Performance monitoring route (protected)
router.get(
  "/performance/stats",
  generalRateLimit,
  requireAuth,
  getPerformanceStats
);

export default router;
