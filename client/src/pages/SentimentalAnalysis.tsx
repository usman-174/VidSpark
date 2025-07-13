import axiosInstance from "@/api/axiosInstance";
import SentimentChart from "@/components/sentimentalAnalysis/SentimentChart";
import VideoAnalysisForm from "@/components/sentimentalAnalysis/VideoAnalysisForm";
import useAuthStore from "@/store/authStore";
import { useEffect, useState, useCallback } from "react";
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

const SentimentAnalysis = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(
    null
  );
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [videoId, setVideoId] = useState(searchParams.get("videoId") || "");
  const [videoTitle, setVideoTitle] = useState("");
  const [activeTab, setActiveTab] = useState("comments");

  // Remove videoId from dependency array to prevent re-triggering
  const analyzeSentiment = async (id: string = videoId) => {
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
  }; // Removed videoId from dependencies

  // Auto-analyze when component mounts with videoId in URL - only run once
  useEffect(() => {
    const urlVideoId = searchParams.get("videoId");
    if (urlVideoId && urlVideoId.trim() && !sentimentData) {
      setVideoId(urlVideoId); // This won't trigger analyzeSentiment anymore
      analyzeSentiment(urlVideoId); // Pass the ID directly
    }
  }, []); // Empty dependency array - only run on mount

  const handleAnalyzeSentiment = () => {
    analyzeSentiment();
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            YouTube Video Sentiment Analysis
          </h1>
          <p className="mt-2 text-gray-600">
            Analyze the sentiment of comments, title, description, and tags for
            any YouTube video
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          <VideoAnalysisForm
            videoId={videoId}
            setVideoId={setVideoId}
            onAnalyze={handleAnalyzeSentiment}
            loading={loading}
            error={error}
            videoTitle={videoTitle}
          />

          {sentimentData && (
            <SentimentChart
              sentimentData={sentimentData}
              videoTitle={videoTitle}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysis;
