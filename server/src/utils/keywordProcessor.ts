import { fetchSearchResults } from "../services/youtubeApiService";


export const getSuggestions = async (keyword: string): Promise<string[]> => {
  if (!keyword.trim()) return [];

  // Fetch top videos related to the keyword
  const videos = await fetchSearchResults(keyword);

  if (!videos || videos.length === 0) return [];

  // Map to keep track of keyword frequencies weighted by views
  const keywordScores: Record<string, number> = {};

  // Simple stopwords to ignore common words
  const stopwords = new Set([
    "the", "and", "for", "with", "from", "that", "this", "you", "your", 
    "are", "but", "not", "can", "all", "any", "have", "has", "was", "will", 
    "it's", "its", "they", "them", "their", "about", "what", "which", "when",
  ]);

  // Helper: Clean and split title into words
  const extractWords = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopwords.has(word));
  };

  // Process each video title
  for (const video of videos) {
    const title = video.title || "";
    const views = Number(video.viewCount) || 0;

    const words = extractWords(title);

    words.forEach(word => {
      // Ignore the keyword itself (or its parts)
      if (word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word)) {
        return;
      }

      // Increase score weighted by views
      keywordScores[word] = (keywordScores[word] || 0) + views;
    });
  }

  // Sort keywords by score descending
  const sortedKeywords = Object.entries(keywordScores)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([word]) => word);

  // Return top 5 unique suggestions
  return sortedKeywords.slice(0, 5);
};


export const getOpportunityScore = (videos: any[]): number => {
  if (!videos.length) return 100;
  const totalViews = videos.reduce((sum, v) => sum + (v.viewCount || 1000), 0);
  return Math.max(0, 100 - totalViews / videos.length / 1000);
};

export const getTopVideos = (videos: any[], topN = 5) => {
  return videos
    .sort((a, b) => {
      const aViews = Number(a.statistics?.viewCount || 0);
      const bViews = Number(b.statistics?.viewCount || 0);
      return bViews - aViews;
    })
    .slice(0, topN);
};
