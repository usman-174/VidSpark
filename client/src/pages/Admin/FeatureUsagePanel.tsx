import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bar } from "react-chartjs-2";

import type { FeatureUsageStats } from "@/types/adminTypes";
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
        `/api/admin/feature-usage-by-range?range=${selectedRange}`
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
    <div className="relative">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feature Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {loading || !data || !data.success ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <Bar data={chartData} options={chartOptions} />
            )}
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

export default FeatureUsageChartWithPanel;
