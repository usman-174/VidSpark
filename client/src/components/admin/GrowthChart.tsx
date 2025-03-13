import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserGrowthData } from "@/types/adminTypes";
import { Bar } from "react-chartjs-2";

const GrowthChart = ({ data, loading }: { 
  data: UserGrowthData | null;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Growth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.dailyGrowth || data.dailyGrowth.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Growth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            No growth data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    labels: data.dailyGrowth.map((entry) =>
      new Date(entry.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    ),
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
          title: (items: any) => {
            const date = new Date(data.dailyGrowth[items[0].dataIndex].date);
            return date.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          },
          label: (item: any) => `New Users: ${item.raw}`,
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
          callback: (value: number) => value.toLocaleString(),
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>User Growth Trend</span>
          <div className="text-sm font-normal text-gray-500">
            {`Avg. ${data.trends.averageDaily} users/day`}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Bar data={chartData} options={chartOptions as any} />
        </div>
      </CardContent>
    </Card>
  );
};

export default GrowthChart;