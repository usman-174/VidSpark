import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar } from "react-chartjs-2";
const GrowthChart = ({ data, loading }) => {
    if (loading) {
        return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "User Growth Trend" }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-64", children: _jsx(Skeleton, { className: "h-full w-full" }) }) })] }));
    }
    if (!data?.dailyGrowth || data.dailyGrowth.length === 0) {
        return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "User Growth Trend" }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-64 flex items-center justify-center text-gray-500", children: "No growth data available" }) })] }));
    }
    const chartData = {
        labels: data.dailyGrowth.map((entry) => new Date(entry.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        })),
        datasets: [
            {
                label: "New Users",
                data: data.dailyGrowth.map((entry) => entry.count),
                backgroundColor: "rgba(99, 102, 241, 0.7)",
                borderColor: "rgba(99, 102, 241, 1)",
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 16,
            },
        ],
    };
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                padding: 12,
                titleColor: "rgba(255, 255, 255, 0.8)",
                titleFont: { size: 13 },
                bodyFont: { size: 12 },
                bodyColor: "rgba(255, 255, 255, 0.8)",
                borderColor: "rgba(255, 255, 255, 0.1)",
                borderWidth: 1,
                displayColors: false,
                callbacks: {
                    title: (items) => {
                        const date = new Date(data.dailyGrowth[items[0].dataIndex].date);
                        return date.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        });
                    },
                    label: (item) => `New Users: ${item.raw}`,
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    font: { size: 11 },
                    color: "#6b7280",
                    maxRotation: 45,
                    minRotation: 45,
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: "rgba(0, 0, 0, 0.06)",
                },
                ticks: {
                    font: { size: 11 },
                    color: "#6b7280",
                    padding: 8,
                    stepSize: 1,
                    callback: (value) => value.toLocaleString(),
                },
            },
        },
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-lg flex items-center justify-between", children: [_jsx("span", { children: "User Growth Trend" }), _jsx("div", { className: "text-sm font-normal text-gray-500", children: `Avg. ${data.trends.averageDaily} users/day` })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-64", children: _jsx(Bar, { data: chartData, options: chartOptions }) }) })] }));
};
export default GrowthChart;
