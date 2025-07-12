import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

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
  value: number;
  description: string;
  color: string;
}

interface SentimentChartProps {
  sentimentData: SentimentData;
  videoTitle: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const SentimentChart = ({
  sentimentData,
  videoTitle,
  activeTab,
  setActiveTab
}: SentimentChartProps) => {
  
  const chartData = useMemo((): ChartDataItem[] => {
    if (!sentimentData) return [];

    try {
      if (activeTab === "comments") {
        const sentiment = sentimentData.weightedOverallSentiment;
        if (!sentiment) return [];
        
        return [
          {
            name: "Positive",
            value: parseFloat(((sentiment.positive || 0) * 100).toFixed(1)),
            description: "Comments expressing positive feedback or enthusiasm",
            color: "#22C55E"
          },
          {
            name: "Neutral",
            value: parseFloat(((sentiment.neutral || 0) * 100).toFixed(1)),
            description: "Comments that are neutral or factual without strong emotion",
            color: "#F59E0B"
          },
          {
            name: "Negative",
            value: parseFloat(((sentiment.negative || 0) * 100).toFixed(1)),
            description: "Comments expressing criticism or negative feedback",
            color: "#EF4444"
          },
        ];
      } else if (activeTab === "title") {
        const titleSentiment = sentimentData.videoMetadata?.title?.sentiment?.scores;
        if (!titleSentiment) return [];
        
        return [
          {
            name: "Positive",
            value: parseFloat(((titleSentiment.positive || 0) * 100).toFixed(1)),
            description: "Title conveys a positive tone",
            color: "#22C55E"
          },
          {
            name: "Neutral",
            value: parseFloat(((titleSentiment.neutral || 0) * 100).toFixed(1)),
            description: "Title is neutral or factual",
            color: "#F59E0B"
          },
          {
            name: "Negative",
            value: parseFloat(((titleSentiment.negative || 0) * 100).toFixed(1)),
            description: "Title conveys a negative tone",
            color: "#EF4444"
          },
        ];
      } else if (activeTab === "description") {
        const descSentiment = sentimentData.videoMetadata?.description?.sentiment?.scores;
        if (!descSentiment) return [];
        
        return [
          {
            name: "Positive",
            value: parseFloat(((descSentiment.positive || 0) * 100).toFixed(1)),
            description: "Description conveys a positive tone",
            color: "#22C55E"
          },
          {
            name: "Neutral",
            value: parseFloat(((descSentiment.neutral || 0) * 100).toFixed(1)),
            description: "Description is neutral or factual",
            color: "#F59E0B"
          },
          {
            name: "Negative",
            value: parseFloat(((descSentiment.negative || 0) * 100).toFixed(1)),
            description: "Description conveys a negative tone",
            color: "#EF4444"
          },
        ];
      } else if (activeTab === "tags") {
        const tagsSentiment = sentimentData.videoMetadata?.tags?.sentiment?.scores;
        if (!tagsSentiment) return [];
        
        return [
          {
            name: "Positive",
            value: parseFloat(((tagsSentiment.positive || 0) * 100).toFixed(1)),
            description: "Tags suggest a positive context",
            color: "#22C55E"
          },
          {
            name: "Neutral",
            value: parseFloat(((tagsSentiment.neutral || 0) * 100).toFixed(1)),
            description: "Tags are neutral or descriptive",
            color: "#F59E0B"
          },
          {
            name: "Negative",
            value: parseFloat(((tagsSentiment.negative || 0) * 100).toFixed(1)),
            description: "Tags suggest a negative context",
            color: "#EF4444"
          },
        ];
      }
    } catch (error) {
      console.error("Error processing chart data:", error);
      return [];
    }
    
    return [];
  }, [sentimentData, activeTab]);

  const dominantSentiment = useMemo(() => {
    if (!chartData.length) return null;
    try {
      return chartData.reduce((prev, current) =>
        prev.value > current.value ? prev : current
      );
    } catch (error) {
      console.error("Error calculating dominant sentiment:", error);
      return null;
    }
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold">{`${label}: ${data.value}%`}</p>
          <p className="text-sm text-gray-300">{data.description}</p>
        </div>
      );
    }
    return null;
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
      </CardHeader>
      <CardContent>
        <div className="h-80 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#666' }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#666' }}
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
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
                style={{ color: item.color }}
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
  );
};

export default SentimentChart;