// src/controller/titleController.ts
import { Request, Response } from "express";
import { generateTitle } from "../services/titleService";
import { deductCredits } from "../services/userService";

export const generateTitles = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const prompt = req.body.prompt || (req.query.prompt as string);
    const maxLength = parseInt(
      req.body.maxLength || (req.query.maxLength as string) || "400"
    );
    const model =
      req.body.model ||
      (req.query.model as string) ||
      process.env.TITLE_MODEL ||
      "deepseek/deepseek-chat-v3-0324:free";

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
        titles: [],
      });
    }

    const result = await generateTitle({
      prompt,
      maxLength,
      model,
    });

    deductCredits(res.locals.user.userId, 1);

    return res.json(result);
  } catch (error) {
    console.error("Error generating titles:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate titles",
      titles: [],
      error: error.message,
    });
  }
};
