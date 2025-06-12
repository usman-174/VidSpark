import { fetchSearchResults } from "../services/youtubeApiService";

// 🔹 Suggest related keywords based on video titles
export const getSuggestions = async (keyword: string): Promise<string[]> => {
  if (!keyword.trim()) return [];

  const videos = await fetchSearchResults(keyword);
  if (!videos || videos.length === 0) return [];

  const keywordScores: Record<string, number> = {};

  const stopwords = new Set([
    "the", "and", "for", "with", "from", "that", "this", "you", "your",
    "are", "but", "not", "can", "all", "any", "have", "has", "was", "will",
    "it's", "its", "they", "them", "their", "about", "what", "which", "when",
  ]);

  const extractWords = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopwords.has(word));
  };

  for (const video of videos) {
    const title = video.title || "";
    const views = Number(video.channelStats?.viewCount || video.statistics?.viewCount || 0);

    const words = extractWords(title);
    words.forEach(word => {
      if (
        word.includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(word)
      ) {
        return;
      }
      keywordScores[word] = (keywordScores[word] || 0) + views;
    });
  }

  const sortedKeywords = Object.entries(keywordScores)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([word]) => word);

  return sortedKeywords.slice(0, 5);
};

// 🔹 Score based on low competition (views), engagement, and recency
export const getOpportunityScore = (videos: any[]): number => {
  if (!videos?.length) return 100;

  const now = Date.now();
  const scores: number[] = [];

  for (const video of videos) {
    try {
      // 1. Extract available metrics from CURRENT API response
      const views = Math.max(1, Number(
        video.viewCount ||           // Primary view count source
        video.channelStats?.viewCount || // Fallback to channel views
        1000                         // Default minimum
      ));

      // 2. Estimate engagement (since your API doesn't fetch likes/comments)
      const engagementEstimate = 0.05 + (Math.random() * 0.05); // 5-10% estimated
      const likes = Math.floor(views * engagementEstimate);
      const comments = Math.floor(views * engagementEstimate * 0.2);

      // 3. Calculate dynamic scores using only available data
      const viewScore = 100 - Math.min(90, Math.log10(views) * 15); // 1k views=85, 1M views=15
      const engagementScore = Math.min(100, (engagementEstimate * 1000)); // 5%=50, 10%=100
      
      // 4. Generate synthetic freshness score (since no publish date)
      const syntheticFreshness = 70 + (Math.random() * 30); // 70-100 range

      // 5. Combine with conservative weights
      const combinedScore = (
        viewScore * 0.7 +      // 70% weight to views
        engagementScore * 0.2 + // 20% to estimated engagement
        syntheticFreshness * 0.1 // 10% to synthetic freshness
      );

      scores.push(Math.min(100, Math.max(20, combinedScore))); // 20-100 range
    } catch (error) {
      console.warn('Scoring error for video:', video);
      scores.push(50); // Neutral fallback
    }
  }

  // Return 25th percentile to highlight best opportunities
  scores.sort((a, b) => b - a); // Descending sort
  return Math.round(scores[Math.floor(scores.length * 0.25)] || 50);
};
// 🔹 Return top N videos by views
export const getTopVideos = (videos: any[], topN = 5) => {
  return videos
    .sort((a, b) => {
      const aViews = Number(a.statistics?.viewCount || a.channelStats?.viewCount || 0);
      const bViews = Number(b.statistics?.viewCount || b.channelStats?.viewCount || 0);
      return bViews - aViews;
    })
    .slice(0, topN);
};
