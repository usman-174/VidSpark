import axios from "./axiosInstance";

// Types for user insights
export interface UserOverview {
  total_feature_usage: number;
  most_used_feature: string;
  favorite_feature: string;
  activity_streak: number;
  last_active: string;
  member_since: string;
  credit_balance: number;
}

export interface FeatureBreakdown {
  feature: string;
  count: number;
  percentage: number;
}

export interface ContentStats {
  titles_generated: number;
  keywords_analyzed: number;
  sentiment_analyses: number;
  favorite_titles: number;
  evaluation_metrics:number
}

export interface RecentActivity {
  last_30_days: number;
  daily_average: number;
  peak_day: string;
}

export interface PerformanceTrends {
  weekly_activity: number;
  previous_week: number;
  weekly_change_percent: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface DashboardInsights {
  user: {
    name: string;
    email: string;
    createdAt: string;
    creditBalance: number;
  };
  overview: UserOverview;
  feature_breakdown: FeatureBreakdown[];
  content_stats: ContentStats;
  recent_activity: RecentActivity;
  performance_trends: PerformanceTrends;
}

export interface TitlePerformance {
  total_titles: number;
  total_generations: number;
  favorite_titles: number;
  avg_titles_per_generation: number;
  recent_generations: Array<{
    id: string;
    prompt: string;
    titles_count: number;
    created_at: string;
    provider: string;
  }>;
}

export interface KeywordPerformance {
  total_analyses: number;
  recent_keywords: Array<{
    keywords: string[];
    video_url: string;
    created_at: string;
  }>;
}

export interface SentimentPerformance {
  total_analyses: number;
  avg_sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  } | null;
}

export interface ContentPerformance {
  title_performance: TitlePerformance;
  keyword_performance: KeywordPerformance;
  sentiment_performance: SentimentPerformance;
}

export interface UserRecommendations {
  feature_suggestions: string[];
  content_tips: string[];
  optimization_tips: string[];
}

export interface ActivitySummary {
  period: string;
  total_activities: number;
  daily_breakdown: Array<{
    date: string;
    total: number;
    by_feature: Record<string, number>;
  }>;
  peak_hour: string | null;
  most_active_day: {
    date: string;
    total: number;
  };
  feature_usage: Record<string, number>;
}

export interface QuickStats {
  credit_balance: number;
  total_usage: number;
  favorite_feature: string;
  activity_streak: number;
  last_active: string;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// API functions
export const userInsightsAPI = {
  // Get main dashboard insights for homepage
  getDashboardInsights: (): Promise<ApiResponse<DashboardInsights>> =>
    axios.get("/user/insights/dashboard").then((res) => res.data),
  
  // Get content performance metrics
  getContentPerformance: (): Promise<ApiResponse<ContentPerformance>> =>
    axios.get("/user/insights/performance").then((res) => res.data),
  
  // Get personalized recommendations
  getRecommendations: (): Promise<ApiResponse<UserRecommendations>> =>
    axios.get("/user/insights/recommendations").then((res) => res.data),
  
  // Get activity summary with optional days parameter
  getActivitySummary: (days: number = 7): Promise<ApiResponse<ActivitySummary>> =>
    axios.get(`/user/insights/activity?days=${days}`).then((res) => res.data),
  
  // Get quick stats for navbar/header
  getQuickStats: (): Promise<ApiResponse<QuickStats>> =>
    axios.get("/user/insights/quick-stats").then((res) => res.data),
};