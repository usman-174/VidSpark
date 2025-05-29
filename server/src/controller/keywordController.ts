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
): Promise<void> => {
  try {
    const { keyword, userId } = req.body;

    if (!keyword || typeof keyword !== "string") {
      res.status(400).json({ error: "Valid keyword is required" });
      return;
    }

    const analysis = await analyzeKeyword(keyword);

    // If userId is provided, store the analysis with the first videoUrl (use first video if exists)
    if (userId && analysis.topVideos && analysis.topVideos.length > 0) {
      // Use videoUrl from the analyzed data if available, fallback to constructing URL
      const firstVideoUrl =
        analysis.topVideos[0].videoUrl ||
        `https://www.youtube.com/watch?v=${analysis.topVideos[0].videoId}`;

      await prisma.keywordAnalysis.create({
        data: {
          userId,
          videoUrl: firstVideoUrl,
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
    const keywords = await getPopularKeywords(); // [{ term, usageCount }, ...]
    res.json(keywords);
  } catch (err: any) {
    console.error("Failed to fetch popular keywords", err);
    res.status(500).json({ error: "Failed to fetch popular keywords" });
  }
};
