import React, { useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const SentimentAnalysis: React.FC = () => {
  const [videoId, setVideoId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [error, setError] = useState("");

  const handleAnalyzeSentiment = async () => {
    if (!videoId) {
      setError("Please enter a valid YouTube video ID.");
      return;
    }

    setLoading(true);
    setError("");
    setSentimentData(null);

    try {
      const response = await axiosInstance.get(`/videos/sentimental-analysis?videoId=${videoId}`);
      setSentimentData(response.data);
    } catch (err) {
      setError("Failed to analyze sentiment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = sentimentData
    ? {
        labels: ["Positive", "Neutral", "Negative"],
        datasets: [
          {
            label: "Sentiment Analysis",
            data: [
              sentimentData.overallSentiment.positive * 100,
              sentimentData.overallSentiment.neutral * 100,
              sentimentData.overallSentiment.negative * 100,
            ],
            backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
          },
        ],
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-semibold mb-4">YouTube Video Sentiment Analysis</h1>
      <div className="w-full max-w-md flex flex-col space-y-4">
        <input
          type="text"
          placeholder="Enter YouTube Video ID"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <button
          onClick={handleAnalyzeSentiment}
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition duration-300"
        >
          {loading ? "Analyzing..." : "Analyze Sentiment"}
        </button>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {sentimentData && (
        <div className="mt-6 w-full max-w-lg p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Sentiment Analysis Results</h2>
          {chartData && <Bar data={chartData} />}
          <div className="mt-4 flex justify-between text-lg font-medium">
            <span className="text-green-600">Positive: {(sentimentData.overallSentiment.positive * 100).toFixed(2)}%</span>
            <span className="text-yellow-600">Neutral: {(sentimentData.overallSentiment.neutral * 100).toFixed(2)}%</span>
            <span className="text-red-600">Negative: {(sentimentData.overallSentiment.negative * 100).toFixed(2)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysis;