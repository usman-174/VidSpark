import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Target,
  TrendingUp,
  Eye,
  Calendar,
  Clock,
  Lightbulb,
  Trophy,
  Users,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  keywordAnalysisUtils,
  type KeywordAnalysisData,
} from "@/api/keywordAnalysisApi";
import { Link } from "react-router-dom";

interface KeywordAnalysisResultsProps {
  analysisData: KeywordAnalysisData;
  onViewDetails: () => void;
}

const KeywordAnalysisResults = ({
  analysisData,
  onViewDetails,
}: KeywordAnalysisResultsProps) => {
  const [copiedVideoIndex, setCopiedVideoIndex] = useState<number | null>(null);

  const handleCopyVideoTitle = (title: string, index: number) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(title);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = title;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        console.error("Fallback: Oops, unable to copy", err);
      }
      document.body.removeChild(textArea);
    }

    setCopiedVideoIndex(index);
    setTimeout(() => setCopiedVideoIndex(null), 2000);
    toast.success("Video title copied to clipboard!");
  };

  // Render competition score with color
  const renderCompetitionScore = (score: number) => {
    const color = keywordAnalysisUtils.getCompetitionColor(score);
    const text = keywordAnalysisUtils.formatCompetitionScore(score);

    return (
      <div className="flex items-center space-x-2">
        <Progress value={score} className="flex-1 h-2" />
        <span className={`text-sm font-medium ${color}`}>{text}</span>
      </div>
    );
  };

  // Render trend direction
  const renderTrendDirection = (direction: "UP" | "DOWN" | "STABLE") => {
    const icon = keywordAnalysisUtils.getTrendIcon(direction);
    const colors = {
      UP: "text-green-600 bg-green-50",
      DOWN: "text-red-600 bg-red-50",
      STABLE: "text-gray-600 bg-gray-50",
    };

    return (
      <Badge className={`${colors[direction]} border-0`}>
        {icon} {direction}
      </Badge>
    );
  };

  // Format AI insights to handle markdown-like syntax
  const formatInsight = (text: string) => {
    // Split by double asterisks to find titles
    const parts = text.split(/\*\*(.*?)\*\*/g);

    return parts.map((part, partIndex) => {
      if (partIndex % 2 === 1) {
        // This is a title (between **)
        return (
          <span key={partIndex} className="font-semibold text-orange-700">
            {part}
          </span>
        );
      } else {
        // Regular text - handle single asterisks for emphasis
        const emphasizedParts = part.split(/\*(.*?)\*/g);
        return emphasizedParts.map((emphPart, emphIndex) => {
          if (emphIndex % 2 === 1) {
            return (
              <span
                key={`${partIndex}-${emphIndex}`}
                className="font-medium text-gray-800"
              >
                {emphPart}
              </span>
            );
          }
          return emphPart;
        });
      }
    });
  };

  // Safely handle missing data
  if (!analysisData || !analysisData.insights) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No analysis data available</p>
      </div>
    );
  }

  const { insights, videoAnalysis = [], keyword } = analysisData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with View Details Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Analysis Results for "{keyword}"
        </h3>
        {analysisData.analysisId && (
          <Button
            onClick={onViewDetails}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 w-fit"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View Detailed Analysis</span>
          </Button>
        )}
      </div>

      {/* Cache Indicator */}
      {analysisData.isFromCache && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-700 text-sm flex items-center">
            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
            This analysis was retrieved from cache (analyzed within the last 6
            hours)
          </p>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-blue-600 font-medium">
                  Competition Level
                </p>
                <div className="mt-2">
                  {renderCompetitionScore(insights.competitionScore || 0)}
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-green-600 font-medium">
                  Content Opportunity
                </p>
                <div className="mt-2">
                  <Badge
                    className={`${keywordAnalysisUtils.getOpportunityColor(
                      insights.contentOpportunity || "LOW"
                    )} bg-transparent border-0 text-lg font-semibold p-0`}
                  >
                    {insights.contentOpportunity || "N/A"}
                  </Badge>
                </div>
              </div>
              <Target className="h-8 w-8 text-green-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-purple-800 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Key Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Eye className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm text-purple-600 font-medium">
                  Average Views
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {keywordAnalysisUtils.formatViews(insights.averageViews || 0)}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm text-purple-600 font-medium">
                  Recent Videos
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {insights.recentVideoCount || 0}
              </p>
              <p className="text-xs text-gray-500">Last 30 days</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm text-purple-600 font-medium">
                  Trend
                </span>
              </div>
              <div className="flex justify-center">
                {renderTrendDirection(insights.trendDirection || "STABLE")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {insights.aiInsights && insights.aiInsights.length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-orange-800 flex items-center">
              <Lightbulb className="h-5 w-5 mr-2" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.aiInsights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-yellow-200 shadow-sm"
                >
                  <div className="bg-orange-100 rounded-full p-2 flex-shrink-0">
                    <span className="text-orange-600 font-bold text-sm">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-700 text-sm leading-relaxed">
                      {formatInsight(insight)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Videos - Preview */}
      {videoAnalysis.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <CardTitle className="text-indigo-800 flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Top Performing Videos (Preview)
              </CardTitle>
              <Button
                onClick={onViewDetails}
                variant="outline"
                size="sm"
                className="text-indigo-600 hover:text-indigo-700 w-fit"
              >
                View All
              </Button>
            </div>
            <p className="text-sm text-indigo-600">
              Click titles to copy • Showing top 5
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {videoAnalysis.slice(0, 5).map((video, index) => (
                <motion.div
                  key={video.videoId || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group p-3 bg-white rounded-lg border border-indigo-200 hover:border-indigo-300 transition-colors cursor-pointer"
                  onClick={() => handleCopyVideoTitle(video.title || "", index)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <h4 className="font-medium text-gray-800 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {video.title || "No title available"}
                      </h4>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {keywordAnalysisUtils.formatViews(video.views || 0)}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {video.channelName || "Unknown Channel"}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {video.uploadDate
                            ? `${keywordAnalysisUtils.getDaysSinceUpload(
                                video.uploadDate
                              )}d ago`
                            : "Unknown date"}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-indigo-500 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      {copiedVideoIndex === index ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Channels */}
      {insights.topChannels && insights.topChannels.length > 0 && (
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-teal-800 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Top Competing Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.topChannels.map((channel, index) => (
                <Link key={index} to={`https://www.youtube.com/@${channel}`} className="no-underline">
                  <Badge
                    variant="outline"
                    className="bg-white text-teal-700 border-teal-200 hover:bg-teal-100 cursor-default"
                  >
                    {channel}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default KeywordAnalysisResults;
