import axios from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserDomainStats } from "@/types/adminTypes";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Link } from "react-router-dom";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
}

interface InvitationStats {
  totalInvitations: number;
  usedInvitations: number;
  pendingInvitations: number;
}

interface CreditStats {
  totalCreditsGiven: number;
  policyStats: { type: string; credits: number }[];
}

interface UserGrowthData {
  date: string;
  count: number;
}

// Register required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  ArcElement,
  Legend
);

export const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [invitations, setInvitations] = useState<InvitationStats | null>(null);
  const [credits, setCredits] = useState<CreditStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [userDomains, setUserDomains] = useState<UserDomainStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, invRes, creditRes, growthRes,domainRes] = await Promise.all([
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
        setUserDomains(domainRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const userGrowthData = {
    labels: userGrowth.map((entry) =>
      new Date(entry.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "New Users",
        data: userGrowth.map((entry) => entry.count),
        backgroundColor: "rgba(99, 102, 241, 0.7)", // Softer purple
        borderRadius: 6,
        barThickness: 30, // Reduce bar thickness
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => ` New Users: ${tooltipItem.raw}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: { size: 12 }, // Smaller text
          color: "#6b7280",
        },
        grid: { display: false },
      },
      y: {
        ticks: { font: { size: 12 } },
        grid: { color: "rgba(0,0,0,0.1)" },
      },
    },
  };
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <Link to="/admin/videos">
        <Button>View Videos</Button>
      </Link>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.activeUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Users Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.newUsersToday}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invitation Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Total Invitations: {invitations?.totalInvitations}</p>
            <p>Used Invitations: {invitations?.usedInvitations}</p>
            <p>Pending Invitations: {invitations?.pendingInvitations}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credit Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Total Credits Given: {credits?.totalCreditsGiven}</p>
            {credits?.policyStats.map((policy, index) => (
              <p key={index}>
                {policy.type}: {policy.credits} credits
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <Bar
            key={JSON.stringify(userGrowthData)}
            data={userGrowthData}
            options={options as any}
          />
        </CardContent>
      </Card>
       {/* User Domain Insights Pie Chart */}
       <Card className="w-full md:w-2/3 mx-auto">
        <CardHeader>
          <CardTitle>User Domain Insights</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Pie 
            data={{
              labels: userDomains.map((entry) => entry.domain),
              datasets: [{
                label: "Users by Domain",
                data: userDomains.map((entry) => entry.count),
                backgroundColor: ["#6366F1", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#3B82F6", "#F472B6", "#34D399"],
                borderWidth: 1,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: "right" },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};
