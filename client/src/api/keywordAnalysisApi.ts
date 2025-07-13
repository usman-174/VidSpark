// src/api/keywordAnalysisApi.ts
import axiosInstance from "./axiosInstance";

// Request interfaces
export interface KeywordAnalysisRequest {
  keyword: string;
}

// Response interfaces
export interface VideoAnalysis {
  videoId: string;
  title: string;
  views: number;
  uploadDate: string;
  channelName: string;
  channelId: string;
  tags: string[];
  description: string;
}

export interface KeywordInsights {
  competitionScore: number;
  averageViews: number;
  trendDirection: "UP" | "DOWN" | "STABLE";
  contentOpportunity: "HIGH" | "MEDIUM" | "LOW";
  recentVideoCount: number;
  topChannels: string[];
  aiInsights: string[];
}

export interface KeywordAnalysisData {
  keyword: string;
  insights: KeywordInsights;
  videoAnalysis: VideoAnalysis[];
  analysisId?: string;
  isFromCache?: boolean;
  analysisDate: string;
  provider: string;
}

export interface KeywordAnalysisResponse {
  success: boolean;
  data: KeywordAnalysisData;
  error?: string;
}

// History interfaces
export interface KeywordHistoryItem {
  id: string;
  keyword: string;
  lastAnalyzed: string;
  searchCount: number;
  videoCount: number;
  insights: KeywordInsights | null;
}

export interface KeywordHistoryResponse {
  success: boolean;
  data: {
    analyses: KeywordHistoryItem[];
    totalCount: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  error?: string;
}

// Trending keywords interfaces
export interface TrendingKeyword {
  keyword: string;
  totalSearches: number;
  lastSearched: string;
}

export interface TrendingKeywordsResponse {
  success: boolean;
  data: {
    trending: TrendingKeyword[];
    totalCount: number;
    generatedAt: string;
  };
  error?: string;
}

// Analysis details interfaces
export interface DetailedAnalysisInsight {
  id: string;
  competitionScore: number;
  averageViews: number;
  trendDirection: "UP" | "DOWN" | "STABLE";
  contentOpportunity: "HIGH" | "MEDIUM" | "LOW";
  recentVideoCount: number;
  topChannels: string[];
  aiInsights: string[];
  analysisDate: string;
}

export interface DetailedAnalysis {
  id: string;
  keyword: string;
  firstAnalyzed: string;
  lastUpdated: string;
  searchCount: number;
  insights: DetailedAnalysisInsight[];
  videoAnalysis: VideoAnalysis[];
}

export interface AnalysisDetailsResponse {
  success: boolean;
  data: {
    analysis: DetailedAnalysis;
  };
  error?: string;
}

// Health check interface
export interface KeywordAnalysisHealthResponse {
  service: string;
  status: "healthy" | "unhealthy";
  timestamp: string;
  dependencies: {
    youtube_api: "configured" | "missing_key";
    ollama: "configured" | "using_default";
  };
  error?: string;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API functions
export const keywordAnalysisAPI = {
  // Health check - Check if keyword analysis service is available
  getHealth: (): Promise<KeywordAnalysisHealthResponse> =>
    axiosInstance.get("/keyword-analysis/health").then((res) => res.data),

  // Analyze keyword - Get comprehensive analysis for a keyword
  analyzeKeyword: (
    request: KeywordAnalysisRequest
  ): Promise<KeywordAnalysisResponse> =>
    axiosInstance
      .post("/keyword-analysis/analyze", request)
      .then((res) => res.data),

  // Get user's keyword analysis history
  getHistory: (params?: {
    limit?: number;
    page?: number;
  }): Promise<KeywordHistoryResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.page) queryParams.append("page", params.page.toString());

    const url = `/keyword-analysis/history${
      queryParams.toString() ? `?${queryParams}` : ""
    }`;
    return axiosInstance.get(url).then((res) => res.data);
  },

  // Get trending keywords across platform
  getTrending: (params?: {
    limit?: number;
  }): Promise<TrendingKeywordsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const url = `/keyword-analysis/trending${
      queryParams.toString() ? `?${queryParams}` : ""
    }`;
    return axiosInstance.get(url).then((res) => res.data);
  },

  // Get detailed analysis by ID
  getAnalysisDetails: (analysisId: string): Promise<AnalysisDetailsResponse> =>
    axiosInstance
      .get(`/keyword-analysis/details/${analysisId}`)
      .then((res) => res.data),
};

// Utility functions for working with keyword analysis data
export const keywordAnalysisUtils = {
  // Format competition score to readable text
  formatCompetitionScore: (score: number): string => {
    if (score < 30) return "Low Competition";
    if (score < 60) return "Medium Competition";
    return "High Competition";
  },

  // Get competition color for UI
  getCompetitionColor: (score: number): string => {
    if (score < 30) return "text-green-600";
    if (score < 60) return "text-yellow-600";
    return "text-red-600";
  },

  // Format opportunity level with colors
  getOpportunityColor: (opportunity: "HIGH" | "MEDIUM" | "LOW"): string => {
    switch (opportunity) {
      case "HIGH":
        return "text-green-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "LOW":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  },

  // Format trend direction with icons
  getTrendIcon: (direction: "UP" | "DOWN" | "STABLE"): string => {
    switch (direction) {
      case "UP":
        return "📈";
      case "DOWN":
        return "📉";
      case "STABLE":
        return "➡️";
      default:
        return "➡️";
    }
  },

  // Format view count to readable format
  formatViews: (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  },

  // Calculate days since upload
  getDaysSinceUpload: (uploadDate: string): number => {
    const upload = new Date(uploadDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - upload.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Validate keyword input
  validateKeyword: (keyword: string): { isValid: boolean; error?: string } => {
    if (!keyword || keyword.trim().length === 0) {
      return { isValid: false, error: "Keyword is required" };
    }
    if (keyword.trim().length > 100) {
      return {
        isValid: false,
        error: "Keyword must be less than 100 characters",
      };
    }
    return { isValid: true };
  },

  // Get summary text for insights
  getInsightsSummary: (insights: KeywordInsights): string => {
    const competitionLevel = keywordAnalysisUtils.formatCompetitionScore(
      insights.competitionScore
    );
    const avgViews = keywordAnalysisUtils.formatViews(insights.averageViews);

    return `${competitionLevel} • ${avgViews} avg views • ${insights.contentOpportunity.toLowerCase()} opportunity`;
  },
};
