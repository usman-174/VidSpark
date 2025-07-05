// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes when not in use
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Query Keys - centralized for consistency
export const queryKeys = {
  insights: {
    dashboard: ['insights', 'dashboard'] as const,
    performance: ['insights', 'performance'] as const,
    recommendations: ['insights', 'recommendations'] as const,
    activity: (days: number) => ['insights', 'activity', days] as const,
    quickStats: ['insights', 'quick-stats'] as const,
  },
  videos: {
    trending: ['videos', 'trending'] as const,
    keywords: ['videos', 'keywords'] as const,
  },
} as const;