import { Router, Request, Response } from "express";

const router: Router = Router();

router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

export default router;
