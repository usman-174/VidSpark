import { getNextApiKey, loadKeysFromDB } from "../scripts/YTscraper";
import {
  KeywordAnalysisResponse,
  VideoAnalysis,
  KeywordInsights,
  YouTubeSearchResponse,
  YouTubeVideo,
  YouTubeVideoDetails,
  YouTubeVideoDetailsResponse,
} from "../types/KeywordService";
// keywordAnalysisService.ts - YouTube Keyword Analysis Service
import axios from "axios";
import { incrementFeatureUsage } from "./statsService";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// YouTube API service functions
async function searchYouTubeVideos(
  keyword: string,
  maxResults: number = 50
): Promise<YouTubeVideo[]> {
  await loadKeysFromDB();
  const apiKey = getNextApiKey();
  if (!apiKey) {
    throw new Error("YouTube API key not configured");
  }

  const url = "https://www.googleapis.com/youtube/v3/search";
  const params = {
    part: "snippet",
    q: keyword,
    type: "video",
    maxResults: maxResults.toString(),
    order: "relevance",
    publishedAfter: new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString(), // Last 30 days
    key: apiKey,
  };

  try {
    const response = await axios.get<YouTubeSearchResponse>(url, { params });
    return response.data.items;
  } catch (error: any) {
    console.error(
      "YouTube Search API error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch YouTube search results");
  }
}

async function getVideoDetails(
  videoIds: string[]
): Promise<YouTubeVideoDetails[]> {
  await loadKeysFromDB();
  const apiKey = getNextApiKey();
  if (!apiKey) {
    throw new Error("YouTube API key not configured");
  }

  const url = "https://www.googleapis.com/youtube/v3/videos";
  const params = {
    part: "snippet,statistics",
    id: videoIds.join(","),
    key: apiKey,
  };

  try {
    const response = await axios.get<YouTubeVideoDetailsResponse>(url, {
      params,
    });
    return response.data.items;
  } catch (error: any) {
    console.error(
      "YouTube Video Details API error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch video details");
  }
}

// Analysis functions
function calculateCompetitionScore(videos: VideoAnalysis[]): number {
  const recentVideos = videos.filter(
    (v) =>
      new Date(v.uploadDate).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  );

  // Scale: 0-100 (0 = low competition, 100 = high competition)
  const baseScore = Math.min((recentVideos.length / 10) * 100, 100);

  // Adjust based on view distribution
  const avgViews = videos.reduce((sum, v) => sum + v.views, 0) / videos.length;
  const highViewVideos = videos.filter((v) => v.views > avgViews * 2).length;
  const competitionAdjustment = (highViewVideos / videos.length) * 20;

  return Math.min(baseScore + competitionAdjustment, 100);
}

function determineContentOpportunity(
  competitionScore: number,
  avgViews: number
): "HIGH" | "MEDIUM" | "LOW" {
  if (competitionScore < 30 && avgViews > 5000) return "HIGH";
  if (competitionScore < 60 && avgViews > 2000) return "MEDIUM";
  return "LOW";
}

function analyzeTrendDirection(
  videos: VideoAnalysis[]
): "UP" | "DOWN" | "STABLE" {
  const now = Date.now();
  const recentVideos = videos.filter(
    (v) => new Date(v.uploadDate).getTime() > now - 7 * 24 * 60 * 60 * 1000
  );
  const olderVideos = videos.filter(
    (v) =>
      new Date(v.uploadDate).getTime() <= now - 7 * 24 * 60 * 60 * 1000 &&
      new Date(v.uploadDate).getTime() > now - 14 * 24 * 60 * 60 * 1000
  );

  if (recentVideos.length > olderVideos.length * 1.5) return "UP";
  if (recentVideos.length < olderVideos.length * 0.5) return "DOWN";
  return "STABLE";
}

function getTopChannels(videos: VideoAnalysis[]): string[] {
  const channelCounts = videos.reduce((acc, video) => {
    acc[video.channelName] = (acc[video.channelName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(channelCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([channel]) => channel);
}

// LLM Analysis with fallback
async function generateAIInsights(
  keyword: string,
  insights: Omit<KeywordInsights, "aiInsights">,
  videos: VideoAnalysis[]
): Promise<string[]> {
  const prompt = `Analyze YouTube keyword "${keyword}" with data:
- Competition Score: ${insights.competitionScore}/100
- Average Views: ${insights.averageViews}
- Recent Videos: ${insights.recentVideoCount}
- Trend: ${insights.trendDirection}
- Top Channels: ${insights.topChannels.join(", ")}

Top video titles:
${videos
  .slice(0, 10)
  .map((v) => `- ${v.title} (${v.views} views)`)
  .join("\n")}

Provide exactly 3 actionable insights for content creators as bullet points.`;

  // Try Ollama first
  try {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "qwen3:4b";

    console.log(`🤖 Attempting AI insights with Ollama: ${ollamaModel}`);

    const response = await axios.post(`${ollamaUrl}/api/generate`, {
      model: ollamaModel,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        max_tokens: 300,
      },
    });

    const content = response.data.response;
    const insights = content
      .split("\n")
      .filter(
        (line: string) =>
          line.trim().startsWith("•") || line.trim().startsWith("-")
      )
      .map((line: string) => line.replace(/^[•-]\s*/, "").trim())
      .filter((insight: string) => insight.length > 10)
      .slice(0, 3);

    if (insights.length > 0) {
      console.log("✅ Ollama AI insights generated successfully");
      return insights;
    }
    throw new Error("No valid insights extracted from Ollama response");
  } catch (ollamaError) {
    console.log(
      `⚠️ Ollama failed: ${ollamaError}. Falling back to OpenRouter...`
    );

    // Fallback to OpenRouter
    try {
      const url =
        process.env.OPENROUTER_URL ||
        "https://openrouter.ai/api/v1/chat/completions";
      const model = "deepseek/deepseek-chat-v3-0324:free";

      console.log(`🌐 Using OpenRouter with model: ${model}`);

      const systemMessage = `You are an expert YouTube SEO specialist and content strategist. Analyze keyword data and provide exactly 3 actionable insights as bullet points.`;

      const response = await axios.post(
        url,
        {
          model,
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt },
          ],
          max_tokens: 300,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
            "X-Title": "YouTube Keyword Analysis",
          },
          timeout: 30000,
        }
      );

      const content = response.data.choices[0].message.content;
      const insights = content
        .split("\n")
        .filter(
          (line: string) =>
            line.trim().startsWith("•") ||
            line.trim().startsWith("-") ||
            line.trim().match(/^\d+\./)
        )
        .map((line: string) => line.replace(/^[•-]\s*|\d+\.\s*/, "").trim())
        .filter((insight: string) => insight.length > 10)
        .slice(0, 3);

      if (insights.length > 0) {
        console.log("✅ OpenRouter AI insights generated successfully");
        return insights;
      }
      throw new Error("No valid insights extracted from OpenRouter response");
    } catch (openRouterError) {
      console.error("❌ Both Ollama and OpenRouter failed:", openRouterError);

      // Return fallback insights
      return [
        "Analyze competitor content gaps for opportunities",
        "Optimize titles with emotional triggers and numbers",
        "Create content series around this keyword cluster",
      ];
    }
  }
}

// Database helper functions
async function findExistingKeywordAnalysis(keyword: string, userId?: string) {
  const whereCondition = userId
    ? { keyword, userId }
    : { keyword, userId: null };

  return await prisma.keywordAnalysis.findFirst({
    where: whereCondition,
    include: {
      keywordInsights: {
        orderBy: { analysisDate: "desc" },
        take: 1,
      },
      videoAnalysis: {
        orderBy: { uploadDate: "desc" },
        take: 20,
      },
    },
  });
}

async function saveKeywordAnalysis(
  keyword: string,
  insights: KeywordInsights,
  videoAnalysis: VideoAnalysis[],
  userId?: string
) {
  // Create or update keyword analysis record
  const whereCondition = userId
    ? { keyword, userId }
    : { keyword, userId: null };

  const existingAnalysis = await prisma.keywordAnalysis.findFirst({
    where: whereCondition,
  });

  let keywordAnalysisRecord;

  if (existingAnalysis) {
    // Update existing record - increment search count
    keywordAnalysisRecord = await prisma.keywordAnalysis.update({
      where: { id: existingAnalysis.id },
      data: {
        lastUpdated: new Date(),
        searchCount: { increment: 1 }, // This should properly increment
      },
    });

    console.log(
      `📈 Updated keyword analysis for "${keyword}". New search count: ${keywordAnalysisRecord.searchCount}`
    );
  } else {
    // Create new record
    keywordAnalysisRecord = await prisma.keywordAnalysis.create({
      data: {
        keyword,
        userId,
        searchCount: 1,
      },
    });

    console.log(`🆕 Created new keyword analysis for "${keyword}"`);
  }

  // Save keyword insights
  await prisma.keywordInsights.create({
    data: {
      keywordAnalysisId: keywordAnalysisRecord.id,
      competitionScore: insights.competitionScore,
      averageViews: insights.averageViews,
      trendDirection: insights.trendDirection,
      contentOpportunity: insights.contentOpportunity,
      recentVideoCount: insights.recentVideoCount,
      topChannels: insights.topChannels,
      aiInsights: insights.aiInsights,
    },
  });

  // Clear existing video analysis for this keyword to avoid duplicates
  await prisma.videoAnalysis.deleteMany({
    where: { keywordAnalysisId: keywordAnalysisRecord.id },
  });

  // Save new video analysis data
  const videoData = videoAnalysis.map((video) => ({
    keywordAnalysisId: keywordAnalysisRecord.id,
    videoId: video.videoId,
    title: video.title,
    views: video.views,
    uploadDate: video.uploadDate,
    channelName: video.channelName,
    channelId: video.channelId,
    tags: video.tags,
    description: video.description,
  }));

  await prisma.videoAnalysis.createMany({
    data: videoData,
    skipDuplicates: true,
  });

  return keywordAnalysisRecord.id;
}

async function shouldUseCache(
  keyword: string,
  userId?: string
): Promise<boolean> {
  const existing = await findExistingKeywordAnalysis(keyword, userId);

  if (!existing || !existing.keywordInsights.length) {
    return false;
  }

  const lastAnalysis = existing.keywordInsights[0];
  const hoursSinceLastAnalysis =
    (Date.now() - lastAnalysis.analysisDate.getTime()) / (1000 * 60 * 60);

  // Use cache if analysis is less than 6 hours old
  return hoursSinceLastAnalysis < 6;
}

// Get user's keyword analysis history
export async function getUserKeywordHistory(
  userId: string,
  limit: number = 10
) {
  try {
    const history = await prisma.keywordAnalysis.findMany({
      where: { userId },
      include: {
        keywordInsights: {
          orderBy: { analysisDate: "desc" },
          take: 1,
        },
        _count: {
          select: { videoAnalysis: true },
        },
      },
      orderBy: { lastUpdated: "desc" },
      take: limit,
    });

    return {
      success: true,
      history: history.map((analysis) => ({
        id: analysis.id,
        keyword: analysis.keyword,
        lastAnalyzed: analysis.lastUpdated,
        searchCount: analysis.searchCount,
        videoCount: analysis._count.videoAnalysis,
        insights: analysis.keywordInsights[0] || null,
      })),
    };
  } catch (error) {
    console.error("Error fetching user keyword history:", error);
    return { success: false, history: [] };
  }
}

// Get trending keywords across all users
export async function getTrendingKeywords(limit: number = 10) {
  try {
    // Let's first check what data we have
    const allKeywordAnalyses = await prisma.keywordAnalysis.findMany({
      where: {
        lastUpdated: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        keyword: true,
        searchCount: true,
        lastUpdated: true,
      },
    });

    console.log("🔍 All keyword analyses in last 7 days:", allKeywordAnalyses);

    // Use Prisma groupBy
    const trending = await prisma.keywordAnalysis.groupBy({
      by: ["keyword"],
      _sum: {
        searchCount: true,
      },
      _max: {
        lastUpdated: true,
      },
      where: {
        lastUpdated: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: {
        _sum: {
          searchCount: "desc",
        },
      },
      take: limit,
    });

    console.log("📊 Trending keywords from Prisma groupBy:", trending);

    return {
      success: true,
      trending: trending.map((item) => ({
        keyword: item.keyword,
        totalSearches: item._sum.searchCount || 0,
        lastSearched: item._max.lastUpdated,
      })),
    };
  } catch (error) {
    console.error("Error fetching trending keywords:", error);
    return { success: false, trending: [] };
  }
}
// Main analysis function with database integration
export async function analyzeKeyword(
  keyword: string,
  userId?: string
): Promise<KeywordAnalysisResponse> {
  try {
    console.log(`🔍 Starting keyword analysis for: "${keyword}"`);

    // Check if we should use cached data
    const useCache = await shouldUseCache(keyword, userId);

    if (useCache) {
      console.log(`📋 Using cached data for keyword: "${keyword}"`);

      const existingData = await findExistingKeywordAnalysis(keyword, userId);
      if (existingData && existingData.keywordInsights.length > 0) {
        const insights = existingData.keywordInsights[0];

        // IMPORTANT: Still increment search count even when using cache
        await prisma.keywordAnalysis.update({
          where: { id: existingData.id },
          data: {
            searchCount: { increment: 1 },
            lastUpdated: new Date(), // Update timestamp too
          },
        });

        console.log(
          `📈 Incremented search count for cached keyword: "${keyword}"`
        );

        // Also log feature usage
        if (userId) {
          await incrementFeatureUsage("KEYWORD_ANALYSIS");
        }

        return {
          success: true,
          keyword,
          insights: {
            competitionScore: insights.competitionScore,
            averageViews: insights.averageViews,
            trendDirection: insights.trendDirection,
            contentOpportunity: insights.contentOpportunity,
            recentVideoCount: insights.recentVideoCount,
            topChannels: insights.topChannels,
            aiInsights: insights.aiInsights,
          },
          videoAnalysis: existingData.videoAnalysis.map((v) => ({
            videoId: v.videoId,
            title: v.title,
            views: v.views,
            uploadDate: v.uploadDate,
            channelName: v.channelName,
            tags: v.tags,
            description: v.description || "",
            channelId: v.channelId,
          })),
          analysisId: existingData.id,
          isFromCache: true,
        };
      }
    }

    // Step 1: Search YouTube videos
    const searchResults = await searchYouTubeVideos(keyword, 50);
    if (searchResults.length === 0) {
      return {
        success: false,
        keyword,
        insights: {
          competitionScore: 0,
          averageViews: 0,
          trendDirection: "STABLE",
          contentOpportunity: "LOW",
          recentVideoCount: 0,
          topChannels: [],
          aiInsights: ["No recent videos found for this keyword"],
        },
        videoAnalysis: [],
        error: "No videos found for this keyword",
      };
    }

    // Step 2: Get detailed video statistics
    const videoIds = searchResults.map((video) => video.id.videoId);
    const videoDetails = await getVideoDetails(videoIds);

    // Step 3: Process video data
    const videoAnalysis: VideoAnalysis[] = videoDetails.map((video) => ({
      videoId: video.id,
      title: video.snippet.title,
      views: parseInt(video.statistics.viewCount) || 0,
      uploadDate: new Date(video.snippet.publishedAt),
      channelName: video.snippet.channelTitle,
      tags: video.snippet.tags || [],
      description: video.snippet.description,
      channelId: video.snippet.channelId,
    }));

    // Step 4: Calculate insights
    const competitionScore = calculateCompetitionScore(videoAnalysis);
    const averageViews = Math.round(
      videoAnalysis.reduce((sum, v) => sum + v.views, 0) / videoAnalysis.length
    );
    const trendDirection = analyzeTrendDirection(videoAnalysis);
    const contentOpportunity = determineContentOpportunity(
      competitionScore,
      averageViews
    );
    const recentVideoCount = videoAnalysis.filter(
      (v) =>
        new Date(v.uploadDate).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    ).length;
    const topChannels = getTopChannels(videoAnalysis);

    const basicInsights: Omit<KeywordInsights, "aiInsights"> = {
      competitionScore,
      averageViews,
      trendDirection,
      contentOpportunity,
      recentVideoCount,
      topChannels,
    };

    // Step 5: Generate AI insights
    const aiInsights = await generateAIInsights(
      keyword,
      basicInsights,
      videoAnalysis
    );

    const insights: KeywordInsights = {
      ...basicInsights,
      aiInsights,
    };

    // Step 6: Save to database
    let analysisId;
    try {
      analysisId = await saveKeywordAnalysis(
        keyword,
        insights,
        videoAnalysis,
        userId
      );
      console.log(
        `💾 Saved keyword analysis to database with ID: ${analysisId}`
      );
    } catch (dbError) {
      console.error("Database save error:", dbError);
      // Continue without failing the entire request
    }

    // Step 7: Log feature usage
    if (userId) {
      await incrementFeatureUsage("KEYWORD_ANALYSIS");
    }

    console.log(`✅ Keyword analysis completed for: "${keyword}"`);

    return {
      success: true,
      keyword,
      insights: insights,
      videoAnalysis: videoAnalysis.slice(0, 20), // Return top 20 for performance
      analysisId,
      isFromCache: false,
    };
  } catch (error: any) {
    console.error("❌ Keyword analysis failed:", error.message);
    return {
      success: false,
      keyword,
      insights: {
        competitionScore: 0,
        averageViews: 0,
        trendDirection: "STABLE",
        contentOpportunity: "LOW",
        recentVideoCount: 0,
        topChannels: [],
        aiInsights: ["Analysis temporarily unavailable"],
      },
      videoAnalysis: [],
      error: error.message,
    };
  }
}
