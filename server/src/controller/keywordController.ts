import { Request, Response } from "express";
import { analyzeKeyword, getPopularKeywords } from "../services/keywordService";
import {
  trackFeatureUsage,
  updateFavoriteFeature,
} from "../services/statsService";
import { FeatureType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface KeywordRequest {
  keyword: string;
  userId?: string;
}

export const analyzeKeywordController = async (
  req: Request<{}, {}, KeywordRequest>,
  res: Response
): Promise<void> => {
  const startTime = Date.now();

  try {
    const { keyword } = req.body;
    const userId = res.locals.user?.userId;

    if (!keyword || typeof keyword !== "string") {
      res.status(400).json({ error: "Valid keyword is required" });
      return;
    }

    const analysis = await analyzeKeyword(keyword);

    // Track feature usage after successful analysis
    if (analysis) {
      await trackFeatureUsage(FeatureType.KEYWORD_ANALYSIS, {
        userId: userId,
        processingTime: Date.now() - startTime,
        success: true,
        videosFound: analysis.topVideos?.length || 0,
        opportunityScore: analysis.opportunityScore,
        suggestionsCount: analysis.suggestions?.length || 0,
      });
    }

    // If userId is provided, store the analysis with the first videoUrl (use first video if exists)
    if (userId && analysis.topVideos && analysis.topVideos.length > 0) {
      // Use videoUrl from the analyzed data if available, fallback to constructing URL
      const firstVideoUrl =
        analysis.topVideos[0].videoUrl ||
        `https://www.youtube.com/watch?v=${analysis.topVideos[0].videoId}`;
      console.log("Creating keyword analysis for user:", userId);

      await prisma.keywordAnalysis.create({
        data: {
          userId,
          videoUrl: firstVideoUrl,
          keywords: [keyword.trim()],
        },
      });
      await updateFavoriteFeature(res.locals.user.userId);
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
  const startTime = Date.now();

  try {
    const { filter } = req.query; // "week" | "month" | undefined
    const userId = res.locals.user?.userId;

    if (filter && filter !== "week" && filter !== "month") {
      res.status(400).json({ error: "Invalid filter" });
      return;
    }

    const keywords = await getPopularKeywords(req);

    // Track feature usage for popular keywords retrieval
    

    res.json(keywords);
  } catch (err: any) {
    console.error("Failed to fetch popular keywords", err);
    res.status(500).json({ error: "Failed to fetch popular keywords" });
  }
};
