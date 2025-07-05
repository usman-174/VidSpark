// src/pages/admin/DashboardPage.tsx

import GrowthChart from "@/components/admin/GrowthChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import React from "react";

import {
  CreditStats,
  DomainStats,
  InvitationStats,
  UserGrowthData,
  FeatureUsageStats,
} from "@/types/adminTypes";

import { UserPlus, Users, Users as UsersIcon, BarChart3, UserCheck, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminAPI } from "@/api/adminApi";

// Import new components
import { ComprehensiveInsightsCard } from "@/components/admin/ComprehensiveInsightsCard";
import { UserEngagementInsightsCard } from "@/components/admin/UserEngagementInsightsCard";
import { EnhancedFeatureUsageCard } from "@/components/admin/EnhancedFeatureUsageCard";

// Existing components (keeping them simple for now)
const StatCard = ({
  title,
  value,
  icon: Icon,
  loading,
  subtitle,
}: {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  loading: boolean;
  subtitle?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      <Icon className="h-4 w-4 text-gray-500" />
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <>
          <div className="text-2xl font-bold text-gray-900">
            {value?.toLocaleString()}
          </div>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </>
      )}
    </CardContent>
  </Card>
);

const InvitationsCard = ({
  data,
  loading,
}: {
  data: InvitationStats | null;
  loading: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Invitation Insights</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {loading ? (
        Array(3)
          .fill(0)
          .map((_, i) => <Skeleton key={i} className="h-4 w-full" />)
      ) : (
        <>
          <div className="space-y-2">
            {[
              { label: "Total Invitations", value: data?.totalInvitations },
              { label: "Used Invitations", value: data?.usedInvitations },
              { label: "Conversion Rate", value: `${data?.conversionRate}%` },
            ]?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </CardContent>
  </Card>
);

const CreditsCard = ({
  data,
  loading,
}: {
  data: CreditStats | null;
  loading: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Credit Distribution</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {loading ? (
        Array(3)
          .fill(0)
          .map((_, i) => <Skeleton key={i} className="h-4 w-full" />)
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Credits Given</span>
            <span className="font-medium">{data?.totalCreditsGiven}</span>
          </div>
          {data?.creditsByPolicyType.map((policy, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-gray-600">{policy.type}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{policy.credits}</span>
                <span className="text-sm text-gray-500">
                  ({data.policyStats[index]?.userCount} users)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export const AdminDashboard = () => {
  // Existing basic queries (keeping these for backward compatibility)
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminAPI.getStats,
  });

  const {
    data: invitations,
    isLoading: invitationsLoading,
  } = useQuery({
    queryKey: ["admin", "invitations"],
    queryFn: adminAPI.getInvitations,
  });

  const {
    data: credits,
    isLoading: creditsLoading,
  } = useQuery({
    queryKey: ["admin", "credits"],
    queryFn: adminAPI.getCredits,
  });

  const {
    data: userGrowth,
    isLoading: growthLoading,
  } = useQuery({
    queryKey: ["admin", "growth"],
    queryFn: adminAPI.getUserGrowth,
  });

  const {
    data: userDomains,
    isLoading: domainsLoading,
  } = useQuery({
    queryKey: ["admin", "domains"],
    queryFn: adminAPI.getUserDomains,
  });

  if (statsError) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">Failed to load dashboard data</div>
        <Button onClick={() => refetchStats()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive analytics and insights for your platform</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Activity className="h-3 w-3" />
          Live Data
        </Badge>
      </div>

      {/* Quick Stats Overview */}
      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers}
          icon={Users}
          loading={statsLoading}
          subtitle={`${stats?.userGrowthRate}% growth rate`}
        />
        <StatCard
          title="Users with Referrals"
          value={stats?.usersWithChildren}
          icon={UsersIcon}
          loading={statsLoading}
        />
        <StatCard
          title="New Users Today"
          value={stats?.newUsersToday}
          icon={UserPlus}
          loading={statsLoading}
        />
        <StatCard
          title="Admin Users"
          value={stats?.activeAdminUsers}
          icon={UserCheck}
          loading={statsLoading}
        />
      </div> */}

      {/* Enhanced Analytics Tabs */}
      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="legacy" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Legacy
          </TabsTrigger>
        </TabsList>

        {/* Comprehensive Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <ComprehensiveInsightsCard className="w-full" />
        </TabsContent>

        {/* Enhanced Feature Usage Tab */}
        <TabsContent value="features" className="space-y-6">
          <EnhancedFeatureUsageCard className="w-full" />
        </TabsContent>

        {/* User Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <UserEngagementInsightsCard className="w-full" />
        </TabsContent>

        {/* Legacy Analytics Tab */}
        <TabsContent value="legacy" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <InvitationsCard data={invitations!} loading={invitationsLoading} />
            <CreditsCard data={credits!} loading={creditsLoading} />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <GrowthChart data={userGrowth!} loading={growthLoading} />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Domain Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {domainsLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : userDomains?.domains ? (
                  <div className="space-y-2">
                    {userDomains.domains.slice(0, 5).map((domain, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-600">{domain.domain}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{domain.count}</span>
                          <span className="text-sm text-gray-500">
                            ({domain.percentage}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">No domain data available</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};