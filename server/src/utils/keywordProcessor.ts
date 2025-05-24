export const getSuggestions = async (keyword: string): Promise<string[]> => {
  // Simulate keyword suggestion generation
  return [`${keyword} tutorial`, `${keyword} 2024`, `${keyword} vs`];
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
