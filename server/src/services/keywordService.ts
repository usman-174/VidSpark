import { getSuggestions, getTopVideos, getOpportunityScore } from '../utils/keywordProcessor';
import { fetchCached } from "./cacheService";
import { fetchSearchResults } from './youtubeApiService';

export const analyzeKeyword = async (keyword: string) => {
  const [suggestions, topVideos] = await Promise.all([
    fetchCached(`suggestions:${keyword}`, () => getSuggestions(keyword)),
    fetchCached(`videos:${keyword}`, () => fetchSearchResults(keyword))
  ]);

  const opportunityScore = getOpportunityScore(topVideos);

  return {
    keyword,
    suggestions,
    topVideos,
    opportunityScore
  };
};