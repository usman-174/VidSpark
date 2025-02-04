import axios from "@/api/axiosInstance";
import GrowthChart from "@/components/admin/GrowthChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminStats,
  CreditStats,
  DomainStats,
  InvitationStats,
} from "@/types/adminTypes";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  ArcElement,
  Legend,
} from "chart.js";
import { Star, UserPlus, Users, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Link } from "react-router-dom";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  ArcElement,
  Legend
);

// Stat Card Component
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
      <CardTitle className="text-sm font-medium text-gray-600">
        {title}
      </CardTitle>
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

// Invitations Card Component
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
                {data.topInviters?.map((inviter, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-600 truncate max-w-[200px]">
                      {inviter.email}
                    </span>
                    <span className="font-medium">
                      {inviter.invitationsSent}
                    </span>
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

// Credits Card Component
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

// Domain Distribution Component
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
  console.log("data", data);
  
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
    labels: data?.domains?.map(
      (entry) => `${entry.domain} (${entry.percentage}%)`
    ),
    datasets: [
      {
        data: data?.domains?.map((entry) => entry.count),
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
              return data?.labels?.map((label: string, i: number) => ({
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

// Main Dashboard Component
export const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [invitations, setInvitations] = useState<InvitationStats | null>(null);
  const [credits, setCredits] = useState<CreditStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<{
    dailyGrowth: Array<{ date: string; count: number }>;
    trends: {
      total: number;
      averageDaily: number;
      usersInFamilyStructure: number;
    };
  } | null>(null);

  const [userDomains, setUserDomains] = useState<DomainStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, invRes, creditRes, growthRes, domainRes] =
          await Promise.all([
            axios.get("/admin/stats"),
            axios.get("/admin/invitations"),
            axios.get("/admin/credits"),
            axios.get("/admin/user-growth"),
            axios.get("/admin/user-domains"),
          ]);

        setStats(statsRes.data);
        setInvitations(invRes.data);
        setCredits(creditRes.data);
        setUserGrowth(growthRes.data);
        console.log("Domain data:", domainRes.data);

        setUserDomains(domainRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <Link to="/admin/videos">
          <Button variant="outline">View Videos</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers}
          icon={Users}
          loading={loading}
          subtitle={`${stats?.userGrowthRate}% growth rate`}
        />
        <StatCard
          title="Users with Children"
          value={stats?.usersWithChildren}
          icon={UsersIcon}
          loading={loading}
        />
        <StatCard
          title="New Users Today"
          value={stats?.newUsersToday}
          icon={UserPlus}
          loading={loading}
        />
        <StatCard
          title="Admin Users"
          value={stats?.activeAdminUsers}
          icon={Star}
          loading={loading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InvitationsCard data={invitations} loading={loading} />
        <CreditsCard data={credits} loading={loading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <GrowthChart data={userGrowth} loading={loading} />
        <DomainDistributionCard data={userDomains} loading={loading} />
      </div>
    </div>
  );
};
