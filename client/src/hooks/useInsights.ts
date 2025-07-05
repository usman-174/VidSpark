// src/hooks/useInsights.ts
import { useQuery, useQueries } from '@tanstack/react-query';
import { userInsightsAPI } from '@/api/userInsightsApi';
import { queryKeys } from '@/lib/queryClient';
import axiosInstance from "@/api/axiosInstance";
import { getPopularKeywords } from "@/lib/utils";

// Hook for dashboard insights
export const useDashboardInsights = () => {
  return useQuery({
    queryKey: queryKeys.insights.dashboard,
    queryFn: async () => {
      const response = await userInsightsAPI.getDashboardInsights();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for content performance
export const useContentPerformance = () => {
  return useQuery({
    queryKey: queryKeys.insights.performance,
    queryFn: async () => {
      const response = await userInsightsAPI.getContentPerformance();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook for recommendations
export const useRecommendations = () => {
  return useQuery({
    queryKey: queryKeys.insights.recommendations,
    queryFn: async () => {
      const response = await userInsightsAPI.getRecommendations();
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (recommendations change less frequently)
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook for activity summary
export const useActivitySummary = (days: number = 7) => {
  return useQuery({
    queryKey: queryKeys.insights.activity(days),
    queryFn: async () => {
      const response = await userInsightsAPI.getActivitySummary(days);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook for quick stats
export const useQuickStats = () => {
  return useQuery({
    queryKey: queryKeys.insights.quickStats,
    queryFn: async () => {
      const response = await userInsightsAPI.getQuickStats();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates for quick stats)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for trending videos
export const useTrendingVideos = () => {
  return useQuery({
    queryKey: queryKeys.videos.trending,
    queryFn: async () => {
      const response = await axiosInstance.get("/videos/trending");
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes (trending videos change less frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook for popular keywords (derived from trending videos)
export const usePopularKeywords = () => {
  return useQuery({
    queryKey: queryKeys.videos.keywords,
    queryFn: async () => {
      const response = await axiosInstance.get("/videos/trending");
      return getPopularKeywords(response.data.videos);
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

// Combined hook for all home page data
export const useHomePageData = () => {
  return useQueries({
    queries: [
      {
        queryKey: queryKeys.insights.dashboard,
        queryFn: async () => {
          const response = await userInsightsAPI.getDashboardInsights();
          return response.data;
        },
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: queryKeys.insights.recommendations,
        queryFn: async () => {
          const response = await userInsightsAPI.getRecommendations();
          return response.data;
        },
        staleTime: 10 * 60 * 1000,
      },
      {
        queryKey: queryKeys.videos.trending,
        queryFn: async () => {
          const response = await axiosInstance.get("/videos/trending");
          return response.data;
        },
        staleTime: 15 * 60 * 1000,
      },
    ],
  });
};