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
import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

// Define proper TypeScript interfaces
interface SentimentScores {
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentResult {
  sentiment: string;
  confidence: number;
  scores: SentimentScores;
}

interface VideoMetadata {
  title: {
    original: string;
    sentiment: SentimentResult;
  };
  description: {
    original: string;
    sentiment: SentimentResult;
  };
  tags: {
    original: string[];
    sentiment: SentimentResult;
  };
}

interface SentimentData {
  weightedOverallSentiment: {
    positive: number;
    neutral: number;
    negative: number;
    label: string;
  };
  videoMetadata: VideoMetadata;
  videoTitle: string;
  stats: {
    validCommentsAnalyzed: number;
    totalCommentsReceived: number;
  };
}

interface ChartDataItem {
  name: string;
  value: string;
  description: string;
}

const SentimentAnalysis = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [videoId, setVideoId] = useState(searchParams.get("videoId") || "");
  const [chartType, setChartType] = useState("bar");
  const [copied, setCopied] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [copiedText, setCopiedText] = useState("");
  const [activeTab, setActiveTab] = useState("comments");

  // Memoize analyzeSentiment to prevent unnecessary re-renders
  const analyzeSentiment = useCallback(async (id: string = videoId) => {
    if (!id.trim()) {
      setError("Please enter a valid YouTube video ID");
      return;
    }

    if (user?.creditBalance === 0) {
      setError("Insufficient credits to analyze sentiment.");
      return;
    }

    setSearchParams({ videoId: id }, { replace: true });
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
  }, [user?.creditBalance, setSearchParams, videoId]);

  // Auto-analyze when component mounts with videoId in URL - only run once
  useEffect(() => {
    const urlVideoId = searchParams.get("videoId");
    if (urlVideoId && urlVideoId.trim() && !sentimentData) {
      setVideoId(urlVideoId);
      analyzeSentiment(urlVideoId);
    }
  }, []); // Empty dependency array - only run on mount

  const handleAnalyzeSentiment = () => {
    analyzeSentiment();
  };

  // Safe data access with proper null checks
  const chartData = useMemo((): ChartDataItem[] => {
    if (!sentimentData) return [];

    try {
      if (activeTab === "comments") {
        const sentiment = sentimentData.weightedOverallSentiment;
        if (!sentiment) return [];
        
        return [
          {
            name: "Positive",
            value: ((sentiment.positive || 0) * 100).toFixed(1),
            description: "Comments expressing positive feedback or enthusiasm",
          },
          {
            name: "Neutral",
            value: ((sentiment.neutral || 0) * 100).toFixed(1),
            description: "Comments that are neutral or factual without strong emotion",
          },
          {
            name: "Negative",
            value: ((sentiment.negative || 0) * 100).toFixed(1),
            description: "Comments expressing criticism or negative feedback",
          },
        ];
      } else if (activeTab === "title") {
        const titleSentiment = sentimentData.videoMetadata?.title?.sentiment?.scores;
        if (!titleSentiment) return [];
        
        return [
          {
            name: "Positive",
            value: ((titleSentiment.positive || 0) * 100).toFixed(1),
            description: "Title conveys a positive tone",
          },
          {
            name: "Neutral",
            value: ((titleSentiment.neutral || 0) * 100).toFixed(1),
            description: "Title is neutral or factual",
          },
          {
            name: "Negative",
            value: ((titleSentiment.negative || 0) * 100).toFixed(1),
            description: "Title conveys a negative tone",
          },
        ];
      } else if (activeTab === "description") {
        const descSentiment = sentimentData.videoMetadata?.description?.sentiment?.scores;
        if (!descSentiment) return [];
        
        return [
          {
            name: "Positive",
            value: ((descSentiment.positive || 0) * 100).toFixed(1),
            description: "Description conveys a positive tone",
          },
          {
            name: "Neutral",
            value: ((descSentiment.neutral || 0) * 100).toFixed(1),
            description: "Description is neutral or factual",
          },
          {
            name: "Negative",
            value: ((descSentiment.negative || 0) * 100).toFixed(1),
            description: "Description conveys a negative tone",
          },
        ];
      } else if (activeTab === "tags") {
        const tagsSentiment = sentimentData.videoMetadata?.tags?.sentiment?.scores;
        if (!tagsSentiment) return [];
        
        return [
          {
            name: "Positive",
            value: ((tagsSentiment.positive || 0) * 100).toFixed(1),
            description: "Tags suggest a positive context",
          },
          {
            name: "Neutral",
            value: ((tagsSentiment.neutral || 0) * 100).toFixed(1),
            description: "Tags are neutral or descriptive",
          },
          {
            name: "Negative",
            value: ((tagsSentiment.negative || 0) * 100).toFixed(1),
            description: "Tags suggest a negative context",
          },
        ];
      }
    } catch (error) {
      console.error("Error processing chart data:", error);
      return [];
    }
    
    return [];
  }, [sentimentData, activeTab]);

  // Get dominant sentiment with proper error handling
  const dominantSentiment = useMemo(() => {
    if (!chartData.length) return null;
    try {
      return chartData.reduce((prev, current) =>
        parseFloat(prev.value) > parseFloat(current.value) ? prev : current
      );
    } catch (error) {
      console.error("Error calculating dominant sentiment:", error);
      return null;
    }
  }, [chartData]);

  // Handle copy to clipboard with proper error handling
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  // Get sentiment label for metadata with proper null checks
  const getSentimentLabel = (type: keyof VideoMetadata) => {
    try {
      const sentiment = sentimentData?.videoMetadata?.[type]?.sentiment?.sentiment;
      return sentiment || "N/A";
    } catch (error) {
      console.error(`Error getting sentiment label for ${type}:`, error);
      return "N/A";
    }
  };

  // Get confidence score with proper null checks
  const getConfidenceScore = (type: keyof VideoMetadata) => {
    try {
      const confidence = sentimentData?.videoMetadata?.[type]?.sentiment?.confidence;
      return confidence ? (confidence * 100).toFixed(1) : "N/A";
    } catch (error) {
      console.error(`Error getting confidence score for ${type}:`, error);
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            YouTube Video Sentiment Analysis
          </h1>
          <p className="mt-2 text-gray-600">
            Analyze the sentiment of comments, title, description, and tags for any YouTube video
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Analyze Video</CardTitle>
              <CardDescription>
                Enter a YouTube video ID to analyze sentiments
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
                    <CardTitle>Sentiment Analysis</CardTitle>
                    <CardDescription>
                      Sentiment distribution for "{videoTitle}"
                    </CardDescription>
                  </div>

                  {dominantSentiment && (
                    <Badge
                      style={{
                        backgroundColor:
                          dominantSentiment.name === "Positive"
                            ? "#22C55E"
                            : dominantSentiment.name === "Neutral"
                              ? "#F59E0B"
                              : "#EF4444",
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

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="title">Title</TabsTrigger>
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="tags">Tags</TabsTrigger>
                  </TabsList>
                </Tabs>

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
                <div className="h-80">
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Chart Visualization</h3>
                      <p className="text-sm text-gray-600">
                        Chart.js integration would go here
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Current data: {chartData.map(d => `${d.name}: ${d.value}%`).join(", ")}
                      </p>
                    </div>
                  </div>
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
                        style={{
                          color:
                            item.name === "Positive"
                              ? "#22C55E"
                              : item.name === "Neutral"
                                ? "#F59E0B"
                                : "#EF4444",
                        }}
                      >
                        {item.value}%
                      </span>
                      <span className="text-xs text-gray-500 text-center mt-1">
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>

                {sentimentData.stats && activeTab === "comments" && (
                  <div className="mt-6 text-sm text-gray-600">
                    <p>
                      <span className="font-semibold">Comments Analyzed:</span>{" "}
                      {sentimentData.stats.validCommentsAnalyzed} of{" "}
                      {sentimentData.stats.totalCommentsReceived}
                    </p>
                    <p>
                      <span className="font-semibold">Sentiment Label:</span>{" "}
                      {sentimentData.weightedOverallSentiment?.label || "N/A"}
                    </p>
                  </div>
                )}

                {sentimentData.videoMetadata && (
                  <div className="mt-6 text-sm text-gray-600">
                    {activeTab === "title" && (
                      <div>
                        <p>
                          <span className="font-semibold">Title:</span>{" "}
                          {sentimentData.videoMetadata.title?.original || "N/A"}
                        </p>
                        <p>
                          <span className="font-semibold">Sentiment:</span>{" "}
                          {getSentimentLabel("title")} (Confidence:{" "}
                          {getConfidenceScore("title")}%)
                        </p>
                      </div>
                    )}
                    {activeTab === "description" && (
                      <div>
                        <p>
                          <span className="font-semibold">Description:</span>{" "}
                          {sentimentData.videoMetadata.description?.original?.slice(0, 100) || "N/A"}
                          {sentimentData.videoMetadata.description?.original?.length > 100 && "..."}
                        </p>
                        <p>
                          <span className="font-semibold">Sentiment:</span>{" "}
                          {getSentimentLabel("description")} (Confidence:{" "}
                          {getConfidenceScore("description")}%)
                        </p>
                      </div>
                    )}
                    {activeTab === "tags" && (
                      <div>
                        <p>
                          <span className="font-semibold">Tags:</span>{" "}
                          {sentimentData.videoMetadata.tags?.original?.slice(0, 5)?.join(", ") || "N/A"}
                          {sentimentData.videoMetadata.tags?.original?.length > 5 && "..."}
                        </p>
                        <p>
                          <span className="font-semibold">Sentiment:</span>{" "}
                          {getSentimentLabel("tags")} (Confidence:{" "}
                          {getConfidenceScore("tags")}%)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysis;