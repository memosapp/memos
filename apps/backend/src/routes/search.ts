import { Router } from "express";
import { searchMemos } from "../controllers/searchController";

const router: Router = Router();

router.post("/search", searchMemos);

export default router;
