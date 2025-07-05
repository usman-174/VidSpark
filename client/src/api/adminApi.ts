// src/api/adminApi.ts
import axios from "./axiosInstance";
import { 
  AdminStats, 
  CreditStats, 
  DomainStats, 
  InvitationStats, 
  UserGrowthData,
  FeatureUsageStats, 
} from "@/types/adminTypes";

// ================================
// 📊 RESPONSE TYPES FOR NEW ENDPOINTS
// ================================

// Enhanced Feature Usage Stats Response
export interface EnhancedFeatureUsageResponse {
  success: boolean;
  data: {
    usage: Record<string, number>;
    total_usage: number;
    period: string;
    most_popular_feature: string;
    detailed_stats?: {
      time_based_usage: any[];
      daily_insights: any[];
      user_engagement: any;
      system_performance: {
        avg_response_time: number;
        error_rate: number;
        success_rate: number;
        total_requests: number;
      };
      popular_content: {
        titles: any[];
        tags: any[];
        keywords: any[];
      };
      trends: any;
      peak_usage_insights: any;
      feature_performance: any[];
      summary: {
        total_features_used: number;
        active_users_last_30d: number;
        user_engagement_rate: number;
        avg_processing_time: number;
        system_health: string;
      };
    };
  };
  message: string;
}

// Feature Usage By Range Response
export interface FeatureUsageByRangeResponse {
  success: boolean;
  data: {
    usage: { feature: string; count: number }[];
    range: string;
    interval: string;
    topFeature: string | null;
    growth_rate: number;
    insights: {
      total_requests: number;
      avg_daily_usage: number;
      peak_day: any;
      feature_distribution: { feature: string; count: number; percentage: number }[];
    };
  };
  message: string;
}

// Comprehensive Insights Response
export interface ComprehensiveInsightsResponse {
  success: boolean;
  data: any; // This would be the full insights summary from generateInsightsSummary()
  message: string;
}

// User Engagement Insights Response
export interface UserEngagementInsightsResponse {
  success: boolean;
  data: {
    overview: any;
    top_engaged_users: Array<{
      user: {
        name: string;
        email: string;
        createdAt: string;
      };
      stats: {
        total_sessions: number;
        favorite_feature: string;
        keyword_analysis_count: number;
        title_generation_count: number;
        sentiment_analysis_count: number;
        evaluation_metric_count: number;
        last_active: string;
      };
    }>;
    feature_adoption: Array<{
      feature: string;
      user_count: number;
      adoption_rate: number;
    }>;
  };
  message: string;
}

// ================================
// 📊 ADMIN API FUNCTIONS
// ================================

export const adminAPI = {
  // ================================
  // 📊 EXISTING ENDPOINTS (UNCHANGED)
  // ================================
  
  getStats: () =>
    axios.get<AdminStats>("/admin/stats").then((res) => res.data),
  
  getInvitations: () =>
    axios.get<InvitationStats>("/admin/invitations").then((res) => res.data),
  
  getCredits: () =>
    axios.get<CreditStats>("/admin/credits").then((res) => res.data),
  
  getUserGrowth: () =>
    axios.get<UserGrowthData>("/admin/user-growth").then((res) => res.data),
  
  getUserDomains: () =>
    axios.get<DomainStats>("/admin/user-domains").then((res) => res.data),
  
  getFeatureUsage: () =>
    axios.get<FeatureUsageStats>("/admin/feature-usage").then((res) => res.data),

  // ================================
  // 📊 ENHANCED FEATURE USAGE ENDPOINTS
  // ================================
  
  // Enhanced Feature Usage with optional detailed stats
  getEnhancedFeatureUsage: (period: string = "30d", detailed: boolean = false) =>
    axios
      .get<EnhancedFeatureUsageResponse>(
        `/admin/feature-usage?period=${period}&detailed=${detailed}`
      )
      .then((res) => res.data),
  
  // Feature usage by date range with enhanced insights
  getFeatureUsageByRange: (range: string = "7d") =>
    axios
      .get<FeatureUsageByRangeResponse>(
        `/admin/feature-usage-by-range?range=${range}`
      )
      .then((res) => res.data),

  // ================================
  // 📊 NEW COMPREHENSIVE INSIGHTS ENDPOINTS
  // ================================
  
  // Complete dashboard insights
  getComprehensiveInsights: (days: number = 30) =>
    axios
      .get<ComprehensiveInsightsResponse>(
        `/admin/insights/comprehensive?days=${days}`
      )
      .then((res) => res.data),
  
  // User engagement detailed insights
  getUserEngagementInsights: () =>
    axios
      .get<UserEngagementInsightsResponse>("/admin/insights/user-engagement")
      .then((res) => res.data),
};