import {
  getSuggestions,
  getTopVideos,
  getOpportunityScore,
} from "../utils/keywordProcessor";
import { fetchCached } from "./cacheService";
import { fetchSearchResults } from "./youtubeApiService";
import { recordKeywordUsage, getTopKeywords } from "./keywordStatsService";

export const analyzeKeyword = async (keyword: string) => {
  await recordKeywordUsage(keyword); // Track keyword use

  const [suggestions, topVideos] = await Promise.all([
    fetchCached(`suggestions:${keyword}`, () => getSuggestions(keyword)),
    fetchCached(`videos:${keyword}`, () => fetchSearchResults(keyword)),
  ]);

  const opportunityScore = getOpportunityScore(topVideos);

  return {
    keyword,
    suggestions,
    topVideos,
    opportunityScore,
  };
};

export const getPopularKeywords = async () => {
  return await getTopKeywords(); // Top trending keywords
};
