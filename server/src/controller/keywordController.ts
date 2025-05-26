import { Request, Response } from "express";
import { analyzeKeyword, getPopularKeywords } from "../services/keywordService";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface KeywordRequest {
  keyword: string;
  userId?: string;
}

export const analyzeKeywordController = async (
  req: Request<{}, {}, KeywordRequest>,
  res: Response
): Promise<any> => {
  try {
    const { keyword, userId } = req.body;

    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({ error: "Valid keyword is required" });
    }

    const analysis = await analyzeKeyword(keyword);

    if (userId) {
      await prisma.keywordAnalysis.create({
        data: {
          userId,
          videoUrl: "",
          keywords: [keyword.trim()],
        },
      });
    }

    res.json(analysis);
  } catch (err: any) {
    console.error("Keyword analysis error:", err);
    res.status(500).json({
      error: "Failed to analyze keyword",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const getPopularKeywordsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const keywords = await getPopularKeywords(); // This should return [{ term, usageCount }, ...]
    res.json(keywords);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch popular keywords" });
  }
};
