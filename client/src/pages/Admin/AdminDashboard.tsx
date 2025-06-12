// src/pages/admin/DashboardPage.tsx

import GrowthChart from "@/components/admin/GrowthChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pie, Bar } from "react-chartjs-2";
import {
  CreditStats,
  DomainStats,
  InvitationStats,
  UserGrowthData,
  FeatureUsageStats,
} from "@/types/adminTypes";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title as ChartTitle,
  Tooltip,
} from "chart.js";
import { UserPlus, Users, Users as UsersIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminAPI } from "@/api/adminApi";
import React from "react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  ArcElement,
  Legend
);

// Simplified StatCard component
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

// InvitationsCard component
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
          {data?.topInviters && data.topInviters.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Top Inviters</h3>
              <div className="space-y-2">
                {data.topInviters.map((inviter, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-600 truncate max-w-[200px]">
                      {inviter.email}
                    </span>
                    <span className="font-medium">{inviter.invitationsSent}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

// CreditsCard component
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

// DomainDistributionCard component
interface DomainDistributionCardProps {
  data: DomainStats | null;
  loading: boolean;
}
const DomainDistributionCard = ({
  data,
  loading,
}: DomainDistributionCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Domain Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!data?.domains || data.domains.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Domain Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            No domain data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    labels: data.domains.map((entry) => `${entry.domain} (${entry.percentage}%)`),
    datasets: [
      {
        data: data.domains.map((entry) => entry.count),
        backgroundColor: [
          "#6366F1",
          "#F59E0B",
          "#10B981",
          "#EF4444",
          "#8B5CF6",
          "#3B82F6",
          "#F472B6",
          "#34D399",
          "#EC4899",
          "#14B8A6",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          font: { size: 11 },
          padding: 12,
          generateLabels: function (chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => ({
                text: label,
                fillStyle: data.datasets[0].backgroundColor[i],
                index: i,
              }));
            }
            return [];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `Users: ${value}`;
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Domain Distribution</span>
          <div className="text-sm font-normal text-gray-500">
            {data.stats.totalDomains} domains total
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Pie data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
};

// ➜ Updated: FeatureUsageChart with numeric font weights
const FeatureUsageChart = ({
  data,
  loading,
}: {
  data: FeatureUsageStats | null;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feature Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feature Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-gray-500">
            Unable to load feature usage.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare the bar chart data
  const chartData = {
    labels: ["Keyword Analysis", "Title Generator"],
    datasets: [
      {
        label: "Usage Count",
        data: [data.usage.keyword_analysis, data.usage.title_generation],
        backgroundColor: ["#4F46E5", "#10B981"],   // Indigo and Emerald
        borderColor: ["#4338CA", "#059669"],       // Darker accents
        borderWidth: 1,
        borderRadius: 6,        // Rounded corners
        maxBarThickness: 40,
      },
    ],
  };

  // Styling options for a more professional look
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false as const,
    layout: {
      padding: { top: 20, right: 20, left: 20, bottom: 10 },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Feature",
          color: "#374151",
          font: { size: 14, weight: 500 }, // numeric weight
          padding: { bottom: 8 },
        },
        ticks: {
          color: "#374151",
          font: { size: 13, weight: 400 },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Count",
          color: "#374151",
          font: { size: 14, weight: 500 }, // numeric weight
          padding: { bottom: 8 },
        },
        ticks: {
          color: "#374151",
          font: { size: 13, weight: 400 },
          precision: 0,
        },
        grid: {
          color: "#E5E7EB", // Light gray grid lines
          drawBorder: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Only one dataset, so hide legend
      },
      title: {
        display: true,
        text: "Feature Usage Overview",
        color: "#1F2937",
        font: { size: 16, weight: 600 }, // numeric weight
        padding: { bottom: 10 },
      },
      tooltip: {
        backgroundColor: "#FFFFFF",
        titleColor: "#1F2937",
        bodyColor: "#374151",
        borderColor: "#D1D5DB",
        borderWidth: 1,
        titleFont: { weight: 600, size: 14 }, // numeric weight
        bodyFont: { size: 13 },
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context: any) => `Count: ${context.raw}`,
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Feature Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
};

export const AdminDashboard = () => {
  // Existing queries:
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

  // ➜ New: feature‐usage query
  const {
    data: featureUsage,
    isLoading: featureUsageLoading,
  } = useQuery({
    queryKey: ["admin", "featureUsage"],
    queryFn: adminAPI.getFeatureUsage,
  });

  // Combine loading flags so we can pass a single “isLoading” to sub‐components
  const isLoading =
    statsLoading ||
    invitationsLoading ||
    creditsLoading ||
    growthLoading ||
    domainsLoading ||
    featureUsageLoading;

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
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      </div>

      {/* ————————————————
          Top‐level Stats
      ———————————————— */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        {/* You can re-enable “Admin Users” if desired */}
        {/* <StatCard
          title="Admin Users"
          value={stats?.activeAdminUsers}
          icon={UsersIcon}
          loading={statsLoading}
        /> */}
      </div>

      {/* ————————————————
          Feature Usage Chart
      ———————————————— */}
      <FeatureUsageChart data={featureUsage!} loading={featureUsageLoading} />

      {/* ————————————————
          Invitations & Credits
      ———————————————— */}
      <div className="grid gap-4 md:grid-cols-2">
        <InvitationsCard data={invitations!} loading={invitationsLoading} />
        <CreditsCard data={credits!} loading={creditsLoading} />
      </div>

      {/* ————————————————
          Growth Chart & Domains
      ———————————————— */}
      <div className="grid gap-4 md:grid-cols-2">
        <GrowthChart data={userGrowth!} loading={growthLoading} />
        <DomainDistributionCard data={userDomains!} loading={domainsLoading} />
      </div>
    </div>
  );
};
