import { Router } from "express";
import { searchMemos } from "../controllers/searchController";
import { requireAuth } from "../middleware/auth";

const router: Router = Router();

// Search route requires authentication
router.post("/search", requireAuth, searchMemos);

export default router;
