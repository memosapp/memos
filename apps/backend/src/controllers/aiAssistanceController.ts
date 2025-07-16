import { Request, Response } from "express";
import {
  getAIAssistance,
  AIAssistanceRequest,
} from "../services/aiAssistanceService";

export const aiAssistance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { type, content, prompt, context }: AIAssistanceRequest = req.body;

    // Validate required fields
    if (!type) {
      res.status(400).json({ error: "AI assistance type is required" });
      return;
    }

    // Validate content for enhance, summarize, and generateTags
    if (
      (type === "enhance" || type === "summarize" || type === "generateTags") &&
      !content
    ) {
      res
        .status(400)
        .json({ error: "Content is required for this AI assistance type" });
      return;
    }

    // Validate prompt for generateContent
    if (type === "generateContent" && !prompt) {
      res
        .status(400)
        .json({ error: "Prompt is required for content generation" });
      return;
    }

    // Validate AI assistance type
    const validTypes = [
      "enhance",
      "summarize",
      "generateTags",
      "generateContent",
    ];
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: "Invalid AI assistance type" });
      return;
    }

    const result = await getAIAssistance({
      type,
      content,
      prompt,
      context,
    });

    res.json(result);
  } catch (error) {
    console.error("Error in AI assistance controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
