import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import keywordExtractor from "keyword-extractor";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export const getPopularKeywords = (videos: any[]): string[] => {
  if (!Array.isArray(videos)) return [];

  const allKeywords: string[] = [];

  videos.forEach((video) => {
    if (video.title) {
      const extracted = extractKeywords(video.title);
      allKeywords.push(...extracted);
    }
  });

  const keywordCounts: Record<string, number> = allKeywords.reduce(
    (acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword);
};
