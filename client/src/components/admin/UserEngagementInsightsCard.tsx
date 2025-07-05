// src/components/admin/UserEngagementInsightsCard.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { adminAPI, UserEngagementInsightsResponse } from "@/api/adminApi";
import { 
  Users, 
  UserCheck, 
  Activity, 
  Star,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface UserEngagementInsightsCardProps {
  className?: string;
}

export const UserEngagementInsightsCard: React.FC<UserEngagementInsightsCardProps> = ({ 
  className = "" 
}) => {
  const [showAllUsers, setShowAllUsers] = useState(false);

  const {
    data: engagement,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["admin", "user-engagement-insights"],
    queryFn: adminAPI.getUserEngagementInsights,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getFeatureColor = (feature: string) => {
    const colors = {
      'KEYWORD_ANALYSIS': 'bg-blue-100 text-blue-800',
      'TITLE_GENERATION': 'bg-green-100 text-green-800',
      'SENTIMENT_ANALYSIS': 'bg-purple-100 text-purple-800',
      'EVALUATION_METRIC': 'bg-orange-100 text-orange-800',
    };
    return colors[feature as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const displayedUsers = showAllUsers 
    ? engagement?.data.top_engaged_users 
    : engagement?.data.top_engaged_users?.slice(0, 5);

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">
            Failed to Load User Engagement Data
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
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          User Engagement Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : engagement?.data ? (
          <div className="space-y-6">
            {/* Overview Stats */}
            {engagement.data.overview && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Active Users</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {engagement.data.overview.activeUsers || 0}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Engagement Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {engagement.data.overview.engagementRate?.toFixed(1) || 0}%
                  </div>
                </div>
              </div>
            )}

            {/* Feature Adoption */}
            {engagement.data.feature_adoption && engagement.data.feature_adoption.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Feature Adoption Rates
                </h3>
                <div className="space-y-3">
                  {engagement.data.feature_adoption.map((feature, index) => (
                    <div key={index} className="p-3 bg-white rounded border">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getFeatureColor(feature.feature)}>
                            {feature.feature?.replace(/_/g, ' ') || 'Unknown'}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {feature.user_count} users
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {feature.adoption_rate?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <Progress 
                        value={feature.adoption_rate || 0} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Engaged Users */}
            {engagement.data.top_engaged_users && engagement.data.top_engaged_users.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Top Engaged Users
                  </h3>
                  {engagement.data.top_engaged_users.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllUsers(!showAllUsers)}
                      className="text-xs"
                    >
                      {showAllUsers ? (
                        <>
                          Show Less <ChevronUp className="h-3 w-3 ml-1" />
                        </>
                      ) : (
                        <>
                          Show All ({engagement.data.top_engaged_users.length}) <ChevronDown className="h-3 w-3 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {displayedUsers?.map((userEngagement, index) => (
                    <div key={index} className="p-4 bg-white rounded border hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-sm">
                            {getInitials(userEngagement.user.name, userEngagement.user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900 truncate">
                                {userEngagement.user.name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {userEngagement.user.email}
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="text-sm font-medium">
                                {userEngagement.stats.total_sessions} sessions
                              </div>
                              <div className="text-xs text-gray-500">
                                Last: {formatDate(userEngagement.stats.last_active)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center gap-2">
                            {userEngagement.stats.favorite_feature && (
                              <Badge className={getFeatureColor(userEngagement.stats.favorite_feature)} variant="secondary">
                                Favorite: {userEngagement.stats.favorite_feature.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>Keywords: {userEngagement.stats.keyword_analysis_count}</div>
                            <div>Titles: {userEngagement.stats.title_generation_count}</div>
                            <div>Sentiment: {userEngagement.stats.sentiment_analysis_count}</div>
                            <div>Metrics: {userEngagement.stats.evaluation_metric_count}</div>
                          </div>
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
            No user engagement data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};