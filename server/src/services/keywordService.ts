import {
  getSuggestions,
  getOpportunityScore,
} from "../utils/keywordProcessor";
import { fetchCached } from "./cacheService";
import { fetchSearchResults } from "./youtubeApiService";
import { recordKeywordUsage, getTopKeywords } from "./keywordStatsService";
import { Request } from "express";
import { incrementFeatureUsage } from "./statsService"; // adjust the path if needed

export const analyzeKeyword = async (keyword: string) => {
  // Track keyword usage
  await recordKeywordUsage(keyword);

  // Fetch suggestions and top videos
  const [suggestions, topVideos] = await Promise.all([
    fetchCached(`suggestions:${keyword}`, () => getSuggestions(keyword)),
    fetchCached(`videos:${keyword}`, () => fetchSearchResults(keyword, true)),
  ]);

  // Calculate overall opportunity score for the keyword based on videos
  const opportunityScore = getOpportunityScore(topVideos);

  // Map videos with metrics
  const videosWithMetrics = topVideos.map((video: any) => {
    const stats = video.channelStats || {
      subscriberCount: 0,
      viewCount: 0,
      videoCount: 0,
    };

    // Compute competition metric
    const competitionMetric =
      stats.subscriberCount * 0.6 + stats.viewCount * 0.4;

    return {
      videoId: video.videoId,
      videoTitle: video.title || '',
      videoUrl: video.videoUrl || '',
      viewCount: video.viewCount || 0,
      channelId: video.channelId,
      channelTitle: video.channelTitle,
      subscriberCount: stats.subscriberCount,
      channelViewCount: stats.viewCount,
      channelVideoCount: stats.videoCount,
      estimatedSearchVolume: video.estimatedSearchVolume || 0,
      competitionMetric,
      opportunityScore: video.opportunityScore || null,
    };
  });

  // ✅ Track feature usage
  await incrementFeatureUsage("keyword_analysis");

  return {
    keyword,
    suggestions,
    topVideos: videosWithMetrics,
    opportunityScore,
  };
};

export const getPopularKeywords = async (req: Request) => {
  const { minUsage } = req.query;

  const keywords = await getTopKeywords();

  if (minUsage) {
    const min = Number(minUsage);
    return keywords.filter((kw) => kw.usageCount >= min);
  }

  return keywords;
};
