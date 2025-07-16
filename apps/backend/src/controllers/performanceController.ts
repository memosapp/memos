import { Request, Response } from "express";
import { getCacheStats } from "../services/searchCacheService";

export const getPerformanceStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const cacheStats = getCacheStats();

    const stats = {
      timestamp: new Date().toISOString(),
      cache: cacheStats,
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
    };

    res.json(stats);
  } catch (error) {
    console.error("Error getting performance stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
