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
  RefreshCw
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

  const handleDaysChange = (value: string) => {
    setSelectedDays(parseInt(value));
  };

  const renderSystemHealth = (health: string) => {
    const healthColors = {
      'Excellent': 'bg-green-100 text-green-800 border-green-200',
      'Good': 'bg-blue-100 text-blue-800 border-blue-200',
      'Needs Attention': 'bg-orange-100 text-orange-800 border-orange-200',
    };

    return (
      <Badge className={healthColors[health as keyof typeof healthColors] || 'bg-gray-100 text-gray-800'}>
        {health}
      </Badge>
    );
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: React.ElementType,
    trend?: { change: number; percentage: number }
  ) => (
    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">{title}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend.percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend.percentage >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend.percentage).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
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
            Comprehensive Insights
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        ) : insights?.data ? (
          <div className="space-y-6">
            {/* System Overview */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderMetricCard("Total Requests", insights.data.performance.totalRequests, BarChart3)}
                {renderMetricCard("Avg Response Time", `${insights.data.performance.avgResponseTime.toFixed(0)} ms`, Activity)}
                {renderMetricCard("Success Rate", `${insights.data.performance.successRate.toFixed(1)}%`, Users)}
              </div>
            </div>

            {/* Feature Performance */}
            {insights.data.performance.metrics.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Feature Performance</h3>
                <div className="space-y-2">
                  {insights.data.performance.metrics.slice(0, 4).map((feature: FeatureMetric) => (
                    <div key={feature.id} className="flex justify-between items-center p-3 bg-white rounded border">
                      <div>
                        <span className="font-medium capitalize">{feature.feature.replace(/_/g, ' ')}</span>
                        <div className="text-xs text-gray-500">{feature.requestCount} requests</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{feature.avgResponseTime}ms</div>
                        <div className="text-xs text-gray-500">
                          {feature.successRate.toFixed(1)}% success
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
