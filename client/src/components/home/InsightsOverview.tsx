import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DashboardInsights } from "@/api/userInsightsApi";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity,
  Target,
  Calendar,
  Star,
  Info
} from "lucide-react";

interface InsightsOverviewProps {
  insights: DashboardInsights | null;
  isLoading: boolean;
}

const InsightsOverview = ({ insights, isLoading }: InsightsOverviewProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!insights) return null;

  const { content_stats, recent_activity, performance_trends, feature_breakdown } = insights;

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing': return 'text-green-600';
      case 'decreasing': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Content Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Target className="mr-2 h-5 w-5 text-blue-500" />
              Content Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Titles</span>
                <span className="font-bold text-blue-600">{content_stats.titles_generated}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Keywords</span>
                <span className="font-bold text-purple-600">{content_stats.keywords_analyzed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sentiment</span>
                <span className="font-bold text-green-600">{content_stats.sentiment_analyses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Favorites</span>
                <span className="font-bold text-yellow-600 flex items-center">
                  <Star className="mr-1 h-4 w-4" />
                  {content_stats.favorite_titles}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Activity className="mr-2 h-5 w-5 text-green-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{recent_activity.last_30_days}</div>
                <div className="text-sm text-gray-600">Last 30 Days</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-700">{recent_activity.daily_average}</div>
                <div className="text-sm text-gray-600">Daily Average</div>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <Calendar className="mr-1 h-3 w-3" />
                  Peak: {recent_activity.peak_day}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Trends */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-purple-500" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">This Week</span>
                <span className="font-bold text-purple-600">{performance_trends.weekly_activity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Week</span>
                <span className="font-bold text-gray-600">{performance_trends.previous_week}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Change</span>
                <div className={`flex items-center font-bold ${getTrendColor(performance_trends.trend)}`}>
                  {getTrendIcon(performance_trends.trend)}
                  <span className="ml-1">{Math.abs(performance_trends.weekly_change_percent)}%</span>
                </div>
              </div>
              <div className="pt-2">
                <Badge 
                  variant="outline" 
                  className={`${performance_trends.trend === 'increasing' ? 'bg-green-50 text-green-700' : 
                    performance_trends.trend === 'decreasing' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}
                >
                  {performance_trends.trend === 'increasing' ? 'Growing' : 
                   performance_trends.trend === 'decreasing' ? 'Declining' : 'Stable'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-orange-500" />
            Feature Usage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feature_breakdown.map((feature) => (
              <div key={feature.feature} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{feature.feature}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{feature.count} uses</span>
                    <Badge variant="secondary">{feature.percentage}%</Badge>
                  </div>
                </div>
                <Progress value={feature.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsOverview;