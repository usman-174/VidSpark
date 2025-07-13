// src/components/admin/EnhancedFeatureUsageCard.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { adminAPI, EnhancedFeatureUsageResponse } from "@/api/adminApi";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from "chart.js";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  RefreshCw,
  Zap
} from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface EnhancedFeatureUsageCardProps {
  className?: string;
}

export const EnhancedFeatureUsageCard: React.FC<EnhancedFeatureUsageCardProps> = ({ 
  className = "" 
}) => {
  const [period, setPeriod] = useState("30d");
  const [showDetailed, setShowDetailed] = useState(true);

  const {
    data: featureUsage,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["admin", "enhanced-feature-usage", period, showDetailed],
    queryFn: () => adminAPI.getEnhancedFeatureUsage(period, showDetailed),
    refetchInterval: 3 * 60 * 1000, // Refetch every 3 minutes
  });

  const formatFeatureName = (feature: string) => {
    return feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (percentage < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Activity className="h-3 w-3 text-gray-400" />;
  };

  const getTrendColor = (percentage: number) => {
    if (percentage > 0) return "text-green-600";
    if (percentage < 0) return "text-red-600";
    return "text-gray-400";
  };

  // Chart data for basic usage
  const chartData = featureUsage?.data.usage ? {
    labels: Object.keys(featureUsage.data.usage).map(formatFeatureName),
    datasets: [
      {
        label: "Usage Count",
        data: Object.values(featureUsage.data.usage),
        backgroundColor: ["#4F46E5", "#10B981", "#F59E0B", "#EF4444"],
        borderColor: ["#4338CA", "#059669", "#D97706", "#DC2626"],
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 60,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `Feature Usage - ${period.toUpperCase()}`,
        font: { size: 14, weight: 600 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            Failed to Load Enhanced Feature Usage
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
            Enhanced Feature Usage
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Detailed View</span>
              <Switch 
                checked={showDetailed} 
                onCheckedChange={setShowDetailed}
              />
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7d</SelectItem>
                <SelectItem value="14d">14d</SelectItem>
                <SelectItem value="30d">30d</SelectItem>
                <SelectItem value="60d">60d</SelectItem>
                <SelectItem value="90d">90d</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : featureUsage?.data ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-900">Total Usage</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {featureUsage.data.total_usage.toLocaleString()}
                    </div>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-900">Most Popular</div>
                    <div className="text-lg font-bold text-green-900">
                      {formatFeatureName(featureUsage.data.most_popular_feature)}
                    </div>
                  </div>
                  <Zap className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-purple-900">Period</div>
                    <div className="text-lg font-bold text-purple-900">
                      Last {featureUsage.data.period}
                    </div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Basic Chart */}
            {chartData && (
              <div className="h-64">
                <Bar data={chartData} options={chartOptions} />
              </div>
            )}

            {/* Detailed Stats (only when detailed is enabled) */}
            {showDetailed && featureUsage.data.detailed_stats && (
              <div className="space-y-6">
                {/* Trends */}
                {featureUsage.data.detailed_stats.trends && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Feature Trends
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {Object.entries(featureUsage.data.detailed_stats.trends).map(([feature, trend]: [string, any]) => (
                        <div key={feature} className="p-3 bg-white rounded border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600">
                              {formatFeatureName(feature)}
                            </span>
                            {getTrendIcon(trend.percentage)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{trend.change > 0 ? '+' : ''}{trend.change}</span>
                            <span className={`text-xs ${getTrendColor(trend.percentage)}`}>
                              ({trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* System Performance */}
                {featureUsage.data.detailed_stats.system_performance && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">System Performance</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-white rounded border">
                        <div className="text-xs text-gray-600">Avg Response Time</div>
                        <div className="text-lg font-bold">
                          {featureUsage.data.detailed_stats.system_performance.avg_response_time}ms
                        </div>
                      </div>
                      {/* <div className="p-3 bg-white rounded border">
                        <div className="text-xs text-gray-600">Success Rate</div>
                        <div className="text-lg font-bold text-green-600">
                          {featureUsage.data.detailed_stats.system_performance.success_rate.toFixed(1)}%
                        </div>
                      </div> */}
                      {/* <div className="p-3 bg-white rounded border">
                        <div className="text-xs text-gray-600">Error Rate</div>
                        <div className="text-lg font-bold text-red-600">
                          {featureUsage.data.detailed_stats.system_performance.error_rate.toFixed(1)}%
                        </div>
                      </div> */}
                      <div className="p-3 bg-white rounded border">
                        <div className="text-xs text-gray-600">Total Requests</div>
                        <div className="text-lg font-bold">
                          {featureUsage.data.detailed_stats.system_performance.total_requests.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary Stats */}
                {featureUsage.data.detailed_stats.summary && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Active Users (30d)</div>
                        <div className="text-xl font-bold">
                          {featureUsage.data.detailed_stats.summary.active_users_last_30d.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">System Health</div>
                        <Badge 
                          className={
                            featureUsage.data.detailed_stats.summary.system_health === 'Excellent' 
                              ? 'bg-green-100 text-green-800' 
                              : featureUsage.data.detailed_stats.summary.system_health === 'Good'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                          }
                        >
                          {featureUsage.data.detailed_stats.summary.system_health}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Peak Usage Insights */}
                {featureUsage.data.detailed_stats.peak_usage_insights && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Peak Usage Insights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-white rounded border">
                        <div className="text-xs text-gray-600">Avg Daily Usage</div>
                        <div className="text-lg font-bold">
                          {featureUsage.data.detailed_stats.peak_usage_insights.avg_daily_usage}
                        </div>
                      </div>
                      {featureUsage.data.detailed_stats.peak_usage_insights.peak_day && (
                        <>
                          <div className="p-3 bg-white rounded border">
                            <div className="text-xs text-gray-600">Peak Day Usage</div>
                            <div className="text-lg font-bold">
                              {featureUsage.data.detailed_stats.peak_usage_insights.peak_day.total_usage}
                            </div>
                          </div>
                          <div className="p-3 bg-white rounded border">
                            <div className="text-xs text-gray-600">Peak Date</div>
                            <div className="text-sm font-medium">
                              {new Date(featureUsage.data.detailed_stats.peak_usage_insights.peak_day.date).toLocaleDateString()}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No enhanced feature usage data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};