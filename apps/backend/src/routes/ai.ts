import { Router } from "express";
import { aiAssistance } from "../controllers/aiAssistanceController";
import { requireAuth } from "../middleware/auth";

const router: Router = Router();

// AI assistance route requires authentication
router.post("/ai/assistance", requireAuth, aiAssistance);

export default router;
