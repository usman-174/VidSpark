// src/pages/admin/DashboardPage.tsx

import GrowthChart from "@/components/admin/GrowthChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pie, Bar } from "react-chartjs-2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import React, { useEffect, useState } from "react";

import {
  CreditStats,
  DomainStats,
  InvitationStats,
  UserGrowthData,
  FeatureUsageStats,FeatureUsageByRangeResponse
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

interface FeatureUsageItem {
  feature: string;
  count: number;
}

interface FeatureUsageRangeResponse {
  success: boolean;
  usage: FeatureUsageItem[];
  topFeature: string | null;
}

const FeatureUsageChartWithPanel = ({
  data,
  loading,
}: {
  data: FeatureUsageStats | null;
  loading: boolean;
}) => {
  const [range, setRange] = useState("7d");
  const [panelData, setPanelData] = useState<FeatureUsageRangeResponse | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);

  const fetchPanelData = async (selectedRange: string) => {
    try {
      setPanelLoading(true);
      const res = await axios.get(
        `/feature-usage-by-range?range=${selectedRange}`
      );
      setPanelData(res.data);
    } catch (error) {
      console.error("❌ Failed to fetch feature usage panel data:", error);
    } finally {
      setPanelLoading(false);
    }
  };

  useEffect(() => {
    fetchPanelData(range);
  }, [range]);

  const chartData = {
    labels: ["Keyword Analysis", "Title Generator", "Sentiment Analysis"],
    datasets: [
      {
        label: "Usage Count",
        data: data
          ? [
              data.usage.keyword_analysis,
              data.usage.title_generation,
              data.usage.sentiment_analysis,
            ]
          : [0, 0, 0],
        backgroundColor: ["#4F46E5", "#10B981", "#F59E0B"],
        borderColor: ["#4338CA", "#059669", "#D97706"],
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 40,
      },
    ],
  };

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
          font: { size: 14, weight: 500 },
          padding: { bottom: 8 },
        },
        ticks: {
          color: "#374151",
          font: { size: 13, weight: 400 },
        },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Count",
          color: "#374151",
          font: { size: 14, weight: 500 },
          padding: { bottom: 8 },
        },
        ticks: {
          color: "#374151",
          font: { size: 13, weight: 400 },
          precision: 0,
        },
        grid: {
          color: "#E5E7EB",
          drawBorder: false,
        },
      },
    },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Feature Usage Overview",
        color: "#1F2937",
        font: { size: 16, weight: 600 },
        padding: { bottom: 10 },
      },
      tooltip: {
        backgroundColor: "#FFFFFF",
        titleColor: "#1F2937",
        bodyColor: "#374151",
        borderColor: "#D1D5DB",
        borderWidth: 1,
        titleFont: { weight: 600, size: 14 },
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
  <div className="relative w-full xl:w-[1100px]">
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Feature Usage</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Added paddingRight to make space for floating panel */}
        <div className="h-64 w-full overflow-x-auto pr-52">
          <div className="min-w-[800px] h-full">
            {loading || !data || !data.success ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <Bar data={chartData} options={chartOptions} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Floating Panel */}
    <div className="absolute top-4 right-4 w-80 z-10">
      <Card className="backdrop-blur-sm shadow-xl bg-white/90 dark:bg-zinc-900/90">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Usage Filter</CardTitle>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="max-h-60 overflow-y-auto">
          {panelLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : panelData?.success ? (
            <>
              <div className="mb-2 text-sm text-muted-foreground">
                <strong>Top Feature:</strong>{" "}
                {panelData.topFeature
                  ? panelData.topFeature.replace(/_/g, " ")
                  : "N/A"}
              </div>
              <div className="space-y-2 text-sm">
                {panelData.usage.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between border-b pb-1 text-sm"
                  >
                    <span className="capitalize text-gray-700">
                      {item.feature.replace(/_/g, " ")}
                    </span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">No data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
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

  const {
    data: featureUsage,
    isLoading: featureUsageLoading,
  } = useQuery({
    queryKey: ["admin", "featureUsage"],
    queryFn: adminAPI.getFeatureUsage,
  });

  // Combine loading flags so we can pass a single "isLoading" to sub-components
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
          Top-level Stats
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
      </div>

      {/* ————————————————
          Feature Usage Chart + Detailed Panel
      ———————————————— */}
      <div className="grid gap-4 md:grid-cols-2">
        <FeatureUsageChartWithPanel data={featureUsage ?? null} loading={featureUsageLoading} />
      </div>

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