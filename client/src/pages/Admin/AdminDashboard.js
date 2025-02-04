import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import axios from "@/api/axiosInstance";
import GrowthChart from "@/components/admin/GrowthChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, ArcElement, Legend, } from "chart.js";
import { Star, UserPlus, Users, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Link } from "react-router-dom";
// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, ArcElement, Legend);
// Stat Card Component
const StatCard = ({ title, value, icon: Icon, loading, subtitle, }) => (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium text-gray-600", children: title }), _jsx(Icon, { className: "h-4 w-4 text-gray-500" })] }), _jsx(CardContent, { children: loading ? (_jsx(Skeleton, { className: "h-8 w-24" })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "text-2xl font-bold text-gray-900", children: value?.toLocaleString() }), subtitle && _jsx("p", { className: "text-sm text-gray-500 mt-1", children: subtitle })] })) })] }));
// Invitations Card Component
const InvitationsCard = ({ data, loading, }) => (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Invitation Insights" }) }), _jsx(CardContent, { className: "space-y-4", children: loading ? (Array(3)
                .fill(0)
                .map((_, i) => _jsx(Skeleton, { className: "h-4 w-full" }, i))) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "space-y-2", children: [
                            { label: "Total Invitations", value: data?.totalInvitations },
                            { label: "Used Invitations", value: data?.usedInvitations },
                            { label: "Conversion Rate", value: `${data?.conversionRate}%` },
                        ]?.map((item, idx) => (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-600", children: item.label }), _jsx("span", { className: "font-medium", children: item.value })] }, idx))) }), data?.topInviters && data.topInviters.length > 0 && (_jsxs("div", { className: "mt-4 border-t pt-4", children: [_jsx("h3", { className: "text-sm font-medium mb-3", children: "Top Inviters" }), _jsx("div", { className: "space-y-2", children: data.topInviters?.map((inviter, idx) => (_jsxs("div", { className: "flex justify-between items-center text-sm", children: [_jsx("span", { className: "text-gray-600 truncate max-w-[200px]", children: inviter.email }), _jsx("span", { className: "font-medium", children: inviter.invitationsSent })] }, idx))) })] }))] })) })] }));
// Credits Card Component
const CreditsCard = ({ data, loading, }) => (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Credit Distribution" }) }), _jsx(CardContent, { className: "space-y-4", children: loading ? (Array(3)
                .fill(0)
                .map((_, i) => _jsx(Skeleton, { className: "h-4 w-full" }, i))) : (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-600", children: "Total Credits Given" }), _jsx("span", { className: "font-medium", children: data?.totalCreditsGiven })] }), data?.creditsByPolicyType.map((policy, index) => (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-600", children: policy.type }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium", children: policy.credits }), _jsxs("span", { className: "text-sm text-gray-500", children: ["(", data.policyStats[index]?.userCount, " users)"] })] })] }, index)))] })) })] }));
const DomainDistributionCard = ({ data, loading, }) => {
    if (loading) {
        return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Domain Distribution" }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-64", children: _jsx(Skeleton, { className: "h-full w-full" }) }) })] }));
    }
    console.log("data", data);
    if (!data?.domains || data.domains.length === 0) {
        return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Domain Distribution" }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-64 flex items-center justify-center text-gray-500", children: "No domain data available" }) })] }));
    }
    const chartData = {
        labels: data?.domains?.map((entry) => `${entry.domain} (${entry.percentage}%)`),
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
                position: "right",
                labels: {
                    font: { size: 11 },
                    padding: 12,
                    generateLabels: function (chart) {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                            return data?.labels?.map((label, i) => ({
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
                    label: (context) => {
                        const value = context.raw;
                        return `Users: ${value}`;
                    },
                },
            },
        },
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-lg flex items-center justify-between", children: [_jsx("span", { children: "Domain Distribution" }), _jsxs("div", { className: "text-sm font-normal text-gray-500", children: [data.stats.totalDomains, " domains total"] })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-64", children: _jsx(Pie, { data: chartData, options: chartOptions }) }) })] }));
};
// Main Dashboard Component
export const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [invitations, setInvitations] = useState(null);
    const [credits, setCredits] = useState(null);
    const [userGrowth, setUserGrowth] = useState(null);
    const [userDomains, setUserDomains] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const [statsRes, invRes, creditRes, growthRes, domainRes] = await Promise.all([
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
            }
            catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setError("Failed to load dashboard data. Please try again later.");
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    if (error) {
        return (_jsxs("div", { className: "p-6 text-center", children: [_jsx("div", { className: "text-red-500 mb-4", children: error }), _jsx(Button, { onClick: () => window.location.reload(), children: "Retry" })] }));
    }
    return (_jsxs("div", { className: "space-y-6 p-6 max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Admin Dashboard" }), _jsx(Link, { to: "/admin/videos", children: _jsx(Button, { variant: "outline", children: "View Videos" }) })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [_jsx(StatCard, { title: "Total Users", value: stats?.totalUsers, icon: Users, loading: loading, subtitle: `${stats?.userGrowthRate}% growth rate` }), _jsx(StatCard, { title: "Users with Children", value: stats?.usersWithChildren, icon: UsersIcon, loading: loading }), _jsx(StatCard, { title: "New Users Today", value: stats?.newUsersToday, icon: UserPlus, loading: loading }), _jsx(StatCard, { title: "Admin Users", value: stats?.activeAdminUsers, icon: Star, loading: loading })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(InvitationsCard, { data: invitations, loading: loading }), _jsx(CreditsCard, { data: credits, loading: loading })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(GrowthChart, { data: userGrowth, loading: loading }), _jsx(DomainDistributionCard, { data: userDomains, loading: loading })] })] }));
};
