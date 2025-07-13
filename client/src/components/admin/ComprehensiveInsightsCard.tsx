// src/components/admin/ComprehensiveInsightsCard.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { adminAPI } from "@/api/adminApi";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  BarChart3,
  RefreshCw,
  Zap,
  Target,
  Video,
  CheckCircle
} from "lucide-react";

// ------------------
// ✅ Types
// ------------------

type InsightToday = {
  id: string;
  date: string;
  keywordAnalysisCount: number;
  sentimentAnalysisCount: number;
  titleGenerationCount: number;
  evaluationMetricCount: number;
  activeUsers: number;
  newUsers: number;
  totalUsers: number;
  totalTitlesGenerated: number;
  totalKeywordsAnalyzed: number;
  totalVideosAnalyzed: number;
  avgResponseTime: number | null;
  errorRate: number | null;
  createdAt: string;
  updatedAt: string;
};

type TotalUsageItem = {
  id: string;
  feature: string;
  totalCount: number;
  createdAt: string;
  updatedAt: string;
};

type TopUser = {
  id: string;
  userId: string;
  keywordAnalysisCount: number;
  sentimentAnalysisCount: number;
  titleGenerationCount: number;
  evaluationMetricCount: number;
  firstUsedAt: string;
  lastUsedAt: string;
  totalSessions: number;
  avgSessionLength: number | null;
  favoriteFeature: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string | null;
    email: string;
  };
};

type UsersInfo = {
  totalUsers: number;
  activeUsers: number;
  engagementRate: number;
  topUsers: TopUser[];
};

type FeatureMetric = {
  id: string;
  timestamp: string;
  avgResponseTime: number;
  requestCount: number;
  errorCount: number;
  feature: string;
  successRate: number;
  memoryUsage: number | null;
  cpuUsage: number | null;
};

type Performance = {
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  avgResponseTime: number;
  successRate: number;
  metrics: FeatureMetric[];
};

type ComprehensiveInsightsData = {
  today: InsightToday;
  totalUsage: TotalUsageItem[];
  users: UsersInfo;
  performance: Performance;
  timestamp: string;
};

type ComprehensiveInsightsResponse = {
  success: boolean;
  data: ComprehensiveInsightsData;
  message: string;
};

interface ComprehensiveInsightsCardProps {
  className?: string;
}

// ------------------
// ✅ Component
// ------------------

export const ComprehensiveInsightsCard: React.FC<ComprehensiveInsightsCardProps> = ({
  className = "",
}) => {
  const [selectedDays, setSelectedDays] = useState<number>(30);

  const {
    data: insights,
    isLoading,
    error,
    refetch
  } = useQuery<ComprehensiveInsightsResponse>({
    queryKey: ["admin", "comprehensive-insights", selectedDays],
    queryFn: () => adminAPI.getComprehensiveInsights(selectedDays),
    refetchInterval: 5 * 60 * 1000,
  });

  console.log("Comprehensive Insights Data:", JSON.stringify(insights, null, 2));
  
  const handleDaysChange = (value: string) => {
    setSelectedDays(parseInt(value));
  };

  const getSystemHealthStatus = (successRate: number) => {
    if (successRate >= 98) return { label: "Excellent", color: "bg-green-100 text-green-800 border-green-200" };
    if (successRate >= 95) return { label: "Good", color: "bg-blue-100 text-blue-800 border-blue-200" };
    if (successRate >= 90) return { label: "Fair", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    return { label: "Needs Attention", color: "bg-red-100 text-red-800 border-red-200" };
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: React.ElementType,
    description?: string
  ) => (
    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* <icon className="h-4 w-4 text-blue-600" /> */}
          <span className="text-sm font-medium text-gray-600">{title}</span>
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      {description && (
        <div className="text-xs text-gray-500">{description}</div>
      )}
    </div>
  );

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            Failed to Load Comprehensive Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            System Overview
          </CardTitle>
          <Select value={selectedDays.toString()} onValueChange={handleDaysChange}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        ) : insights?.data ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderMetricCard(
                "Total Users", 
                insights.data.users.totalUsers.toLocaleString(), 
                Users,
                "Registered users"
              )}
              {renderMetricCard(
                "Active Users", 
                insights.data.users.activeUsers.toLocaleString(), 
                Activity,
                `${insights.data.users.engagementRate.toFixed(1)}% engagement`
              )}
              {renderMetricCard(
                "Videos Analyzed", 
                insights.data.today.totalVideosAnalyzed.toLocaleString(), 
                Video,
                "Total processed"
              )}
              {renderMetricCard(
                "Success Rate", 
                `${insights.data.performance.successRate.toFixed(1)}%`, 
                CheckCircle,
                "System reliability"
              )}
            </div>

            {/* System Health & Performance */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                System Health & Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">System Status</span>
                  </div>
                  <div className="mb-2">
                    <Badge className={getSystemHealthStatus(insights.data.performance.successRate).color}>
                      {getSystemHealthStatus(insights.data.performance.successRate).label}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {insights.data.performance.totalRequests} total requests
                  </div>
                </div>

                {renderMetricCard(
                  "Response Time", 
                  `${insights.data.performance.avgResponseTime.toFixed(0)}ms`, 
                  Activity,
                  "Average response"
                )}

                {renderMetricCard(
                  "Error Rate", 
                  `${insights.data.performance.errorRate.toFixed(1)}%`, 
                  Target,
                  `${insights.data.performance.totalErrors} errors`
                )}

                {renderMetricCard(
                  "Total Operations", 
                  insights.data.totalUsage.reduce((sum, item) => sum + item.totalCount, 0).toLocaleString(),
                  BarChart3,
                  "All features combined"
                )}
              </div>
            </div>

            {/* Feature Usage Summary */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Feature Usage Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {insights.data.totalUsage.map((usage) => (
                  <div key={usage.id} className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-600 mb-1 capitalize">
                      {usage.feature.replace(/_/g, ' ').toLowerCase()}
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {usage.totalCount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Total operations
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Users */}
            {insights.data.users.topUsers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Active Users</h3>
                <div className="space-y-2">
                  {insights.data.users.topUsers.slice(0, 3).map((user, index) => (
                    <div key={user.id} className="flex justify-between items-center p-3 bg-white rounded border">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{user.user.name || 'Anonymous'}</div>
                          <div className="text-xs text-gray-500">{user.user.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{user.totalSessions} sessions</div>
                        <div className="text-xs text-gray-500 capitalize">
                          Prefers {user.favoriteFeature.replace(/_/g, ' ').toLowerCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Timestamp */}
            <div className="text-xs text-gray-500 text-center pt-4 border-t">
              Last updated: {new Date(insights.data.timestamp).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No comprehensive insights data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};