import axiosInstance from "@/api/axiosInstance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import useAuthStore from "@/store/authStore";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bar,
  BarChart,
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
  const handleAnalyzeSentiment = async () => {
    if (!videoId.trim()) {
      setError("Please enter a valid YouTube video ID");
      return;
    }
    setSearchParams({ videoId });

    if (user?.creditBalance === 0) {
      setError("Insufficient credits to analyze sentiment.");
      return;
    }
    setLoading(true);
    setError("");
    setSentimentData(null);

    try {
      const response = await axiosInstance.get(
        `/videos/sentimental-analysis?videoId=${videoId}`
      );
      setSentimentData(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to analyze sentiment. Please try again."
      );
    } finally {
      setLoading(false);
      useAuthStore.getState().refreshUser();
    }
  };

  const chartData = sentimentData
    ? [
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
      ]
    : [];

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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
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
                    disabled={loading}
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
              </div>
            </CardContent>
          </Card>

          {sentimentData && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>
                  Overall sentiment distribution from video comments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
                    >
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
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
      </div>
    </div>
  );
};

export default SentimentAnalysis;
