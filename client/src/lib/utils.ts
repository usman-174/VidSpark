import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


import keywordExtractor from "keyword-extractor";

export const extractKeywords = (text: string): string[] => {
  if (!text) return [];
  return keywordExtractor.extract(text, {
    language: "english",
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: true,
    return_chained_words: true,
  });
};

export const extractKeywordsFromVideos = (videos: any[]): { keyword: string; views: string }[] => {
  if (!Array.isArray(videos)) return [];
  const allKeywords: string[] = [];
  
  videos.forEach((video) => {
    if (video.title && video.description) {
      const extracted = extractKeywords(`${video.title}`);
      allKeywords.push(...extracted);
    }
  });

  const keywordCounts: Record<string, number> = allKeywords.reduce<Record<string, number>>((acc, keyword) => {
    acc[keyword] = (acc[keyword] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([keyword, count]) => ({ keyword, views: `${count * 100}K` }));
};
