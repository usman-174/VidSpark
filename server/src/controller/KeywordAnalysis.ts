// keywordAnalysisController.ts - YouTube Keyword Analysis Controller
import { Request, Response } from "express";
import {
  analyzeKeyword,
  getUserKeywordHistory,
  getTrendingKeywords,
} from "../services/KeywordAnalysis";
import { z } from "zod";
import { deductCredits } from "../services/userService";

// Validation schema
const keywordAnalysisSchema = z.object({
  keyword: z
    .string()
    .min(1, "Keyword is required")
    .max(100, "Keyword must be less than 100 characters")
    .trim(),
});

// Types for request handling
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface KeywordAnalysisRequest extends AuthenticatedRequest {
  body: {
    keyword: string;
  };
}

// Controller function for keyword analysis
export const analyzeKeywordController = async (
  req: KeywordAnalysisRequest,
  res: Response
): Promise<void> => {
  try {
    console.log("📊 Keyword analysis request received");

    // Validate request body
    const validationResult = keywordAnalysisSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: validationResult.error.message,
      });
      return;
    }

    const { keyword } = validationResult.data;
    const userId = res.locals.user?.userId;

    console.log(
      `🔍 Analyzing keyword: "${keyword}" for user: ${userId || "anonymous"}`
    );

    // Perform keyword analysis
    const analysisResult = await analyzeKeyword(keyword, userId);

    // Log the result
    if (analysisResult.success) {
      console.log(
        `✅ Keyword analysis completed successfully for: "${keyword}"`
      );
      console.log(
        `📈 Competition Score: ${analysisResult.insights.competitionScore}/100`
      );
      console.log(`👀 Average Views: ${analysisResult.insights.averageViews}`);
      console.log(
        `📊 Content Opportunity: ${analysisResult.insights.contentOpportunity}`
      );
    } else {
      console.log(`❌ Keyword analysis failed for: "${keyword}"`);
    }
    deductCredits(userId, 1); // Deduct one credit for analysis
    // Return response
    res.status(200).json({
      success: analysisResult.success,
      data: {
        keyword: analysisResult.keyword,
        insights: analysisResult.insights,
        videoAnalysis: analysisResult.videoAnalysis,
        analysisId: analysisResult.analysisId,
        isFromCache: analysisResult.isFromCache || false,
        analysisDate: new Date().toISOString(),
        provider: "youtube_api",
      },
      error: analysisResult.error,
    });
  } catch (error: any) {
    console.error("❌ Keyword analysis controller error:", error);

    res.status(500).json({
      success: false,
      error: "Internal server error occurred during keyword analysis",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Health check for keyword analysis service
export const keywordAnalysisHealthCheck = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { loadKeysFromDB, getNextApiKey } = await import(
      "../scripts/YTscraper"
    );
    await loadKeysFromDB();
    const hasYouTubeKey = !!getNextApiKey();
    const hasOllamaUrl = !!process.env.OLLAMA_URL;

    const status = {
      service: "keyword_analysis",
      status: "healthy",
      timestamp: new Date().toISOString(),
      dependencies: {
        youtube_api: hasYouTubeKey ? "configured" : "missing_key",
        ollama: hasOllamaUrl ? "configured" : "using_default",
      },
    };

    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({
      service: "keyword_analysis",
      status: "unhealthy",
      error: "Service check failed",
    });
  }
};

// Get keyword analysis history
export const getKeywordAnalysisHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = res.locals.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    // Parse query parameters
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    console.log(
      `📋 Fetching keyword analysis history for user: ${userId}, limit: ${limit}, page: ${page}`
    );

    // Get user's keyword analysis history
    const historyResult = await getUserKeywordHistory(userId, limit);

    if (!historyResult.success) {
      res.status(500).json({
        success: false,
        error: "Failed to retrieve analysis history",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        analyses: historyResult.history,
        totalCount: historyResult.history.length,
        page,
        limit,
        hasMore: historyResult.history.length === limit,
      },
    });
  } catch (error: any) {
    console.error("❌ Get keyword analysis history error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve analysis history",
    });
  }
};

// Get trending keywords across platform
export const getTrendingKeywordsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    console.log(`📈 Fetching trending keywords, limit: ${limit}`);

    const trendingResult = await getTrendingKeywords(limit);

    if (!trendingResult.success) {
      res.status(500).json({
        success: false,
        error: "Failed to retrieve trending keywords",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        trending: trendingResult.trending,
        totalCount: trendingResult.trending.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Get trending keywords error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve trending keywords",
    });
  }
};

// Get specific keyword analysis details
export const getKeywordAnalysisDetails = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { analysisId } = req.params;
    const userId = res.locals.user?.userId;

    if (!analysisId) {
      res.status(400).json({
        success: false,
        error: "Analysis ID is required",
      });
      return;
    }

    console.log(`🔍 Fetching analysis details for ID: ${analysisId}`);

    // Import Prisma client here to avoid circular dependency
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const analysis = await prisma.keywordAnalysis.findFirst({
      where: {
        id: analysisId,
        ...(userId && { userId }), // Only filter by userId if user is authenticated
      },
      include: {
        keywordInsights: {
          orderBy: { analysisDate: "desc" },
        },
        videoAnalysis: {
          orderBy: { uploadDate: "desc" },
          take: 50,
        },
      },
    });

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: "Analysis not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        analysis: {
          id: analysis.id,
          keyword: analysis.keyword,
          firstAnalyzed: analysis.firstAnalyzed,
          lastUpdated: analysis.lastUpdated,
          searchCount: analysis.searchCount,
          insights: analysis.keywordInsights,
          videoAnalysis: analysis.videoAnalysis,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Get keyword analysis details error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve analysis details",
    });
  }
};
