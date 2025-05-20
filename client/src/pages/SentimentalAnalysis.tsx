import axiosInstance from "@/api/axiosInstance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuthStore from "@/store/authStore";
import {
  AlertCircle,
  BarChart2,
  Check,
  Clipboard,
  Loader2,
  PieChart as PieChartIcon,
  RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SentimentAnalysis = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [videoId, setVideoId] = useState(searchParams.get("videoId") || "");
  const [chartType, setChartType] = useState("bar");
  const [copied, setCopied] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [copiedText, setCopiedText] = useState("");

  // Auto-analyze when component mounts with videoId in URL
  useEffect(() => {
    const urlVideoId = searchParams.get("videoId");
    if (urlVideoId && urlVideoId.trim()) {
      setVideoId(urlVideoId);
      analyzeSentiment(urlVideoId);
    }
  }, []);

  const analyzeSentiment = async (id = videoId) => {
    if (!id.trim()) {
      setError("Please enter a valid YouTube video ID");
      return;
    }

    // Update URL without triggering a re-render/re-fetch
    if (id !== searchParams.get("videoId")) {
      setSearchParams({ videoId: id }, { replace: true });
    }

    if (user?.creditBalance === 0) {
      setError("Insufficient credits to analyze sentiment.");
      return;
    }

    
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get(
        `/videos/sentimental-analysis?videoId=${String(id).trim()}`
      );
      setSentimentData(response.data);

      if (response.data.videoTitle) {
        setVideoTitle(response.data.videoTitle);
      }

      toast.success("Analysis completed successfully!");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to analyze sentiment. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      useAuthStore.getState().refreshUser();
    }
  };

  const handleAnalyzeSentiment = () => {
    analyzeSentiment();
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!sentimentData) return [];

    return [
      {
        name: "Positive",
        value: sentimentData.overallSentiment.positive * 100,
        fill: "#22C55E",
      },
      {
        name: "Neutral",
        value: sentimentData.overallSentiment.neutral * 100,
        fill: "#F59E0B",
      },
      {
        name: "Negative",
        value: sentimentData.overallSentiment.negative * 100,
        fill: "#EF4444",
      },
    ];
  }, [sentimentData]);

  // Get dominant sentiment
  const dominantSentiment = useMemo(() => {
    if (!chartData.length) return null;

    return chartData.reduce((prev, current) =>
      prev.value > current.value ? prev : current
    );
  }, [chartData]);

  // Prepare sample comments (assuming the API returns these)

  // Handle copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard!");
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Sentiment Analysis
          </h1>
          <p className="mt-2 text-gray-600">
            Analyze the sentiment of YouTube video comments
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Video Analysis</CardTitle>
              <CardDescription>
                Enter a YouTube video ID to analyze comment sentiments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter YouTube Video ID"
                    value={videoId}
                    onChange={(e) => setVideoId(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAnalyzeSentiment}
                    disabled={loading || !videoId.trim()}
                    className="min-w-[120px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing
                      </>
                    ) : (
                      "Analyze"
                    )}
                  </Button>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <div className="flex gap-2 items-center">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </div>
                  </Alert>
                )}

                {loading && !error && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                )}

                {user && (
                  <div className="mt-2 text-sm text-gray-500">
                    Credits remaining:{" "}
                    <span className="font-medium">
                      {user.creditBalance || 0}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>

            {sentimentData && videoTitle && (
              <CardFooter className="flex flex-col items-start">
                <div className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Video: </span>
                  {videoTitle}
                </div>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() =>
                      copyToClipboard(
                        `https://www.youtube.com/watch?v=${videoId}`
                      )
                    }
                  >
                    {copied &&
                    copiedText ===
                      `https://www.youtube.com/watch?v=${videoId}` ? (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <Clipboard className="h-3.5 w-3.5 mr-1" />
                    )}
                    Copy Link
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => analyzeSentiment(videoId)}
                    title="Refresh analysis"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Refresh
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>

          {sentimentData && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Analysis Results</CardTitle>
                    <CardDescription>
                      Overall sentiment distribution from video comments
                    </CardDescription>
                  </div>

                  {dominantSentiment && (
                    <Badge
                      style={{
                        backgroundColor: dominantSentiment.fill,
                        color:
                          dominantSentiment.name === "Neutral"
                            ? "#000"
                            : "#fff",
                      }}
                    >
                      {dominantSentiment.name} Sentiment
                    </Badge>
                  )}
                </div>

                <Tabs value={chartType} onValueChange={setChartType}>
                  <TabsList>
                    <TabsTrigger value="bar">
                      <BarChart2 className="h-4 w-4 mr-1" />
                      Bar Chart
                    </TabsTrigger>
                    <TabsTrigger value="pie">
                      <PieChartIcon className="h-4 w-4 mr-1" />
                      Pie Chart
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 20, right: 20, bottom: 20, left: 60 }}
                      >
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis type="category" dataKey="name" width={70} />
                        <Tooltip
                          formatter={(value: number) => [
                            `${value.toFixed(1)}%`,
                            "Sentiment",
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="value">
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(1)}%`
                          }
                          outerRadius={80}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [
                            `${value.toFixed(1)}%`,
                            "Sentiment",
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  {chartData.map((item) => (
                    <div
                      key={item.name}
                      className="flex flex-col items-center p-4 rounded-lg bg-gray-50"
                    >
                      <span className="text-sm text-gray-600">{item.name}</span>
                      <span
                        className="text-2xl font-semibold"
                        style={{ color: item.fill }}
                      >
                        {item.value.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sample Comments Section (if API provides them) */}
      </div>
    </div>
  );
};

export default SentimentAnalysis;
