// components/ResultsPanel.tsx
import React from 'react';
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Award, TrendingUp, Activity, Target } from "lucide-react";
import { AnalysisResult } from "./types";
import MetricsCard from "./MetricsCard";
import PerformanceMetricsComponent from "./PerformanceMetrics";
import ContentAnalysisCard from "./ContentAnalysisCard";

interface ResultsPanelProps {
  analysisResult: AnalysisResult;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ analysisResult }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getPerformanceCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "viral":
      case "excellent":
        return <Award className="h-4 w-4 text-purple-500" />;
      case "high":
      case "good":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "medium":
      case "average":
        return <Activity className="h-4 w-4 text-yellow-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  const getViralPotentialColor = (potential: string) => {
    switch (potential.toLowerCase()) {
      case "high":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const contentAnalysis = analysisResult.data.insights?.content_analysis;
  const performanceMetrics = analysisResult.data.insights?.performance_metrics;

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Results Disclaimer */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-xs">
          <strong>Results Note:</strong> These are AI estimates -
          actual performance may differ due to various factors.
        </AlertDescription>
      </Alert>

      {/* Main Results Card */}
      <Card className="shadow-lg border-2 border-green-100">
        <MetricsCard
          formattedViews={analysisResult.data.prediction.formatted_views}
          confidence={analysisResult.data.prediction.confidence}
          contentScore={analysisResult.data.content_score}
          performanceCategory={performanceMetrics?.performance_category || "Unknown"}
          getScoreBadgeColor={getScoreBadgeColor}
          getPerformanceCategoryIcon={getPerformanceCategoryIcon}
        />

        <CardContent className="p-6">
          {performanceMetrics && (
            <PerformanceMetricsComponent
              metrics={performanceMetrics}
              getViralPotentialColor={getViralPotentialColor}
            />
          )}
        </CardContent>
      </Card>

      {/* Content Analysis */}
      {contentAnalysis && (
        <ContentAnalysisCard
          analysis={contentAnalysis}
          getScoreColor={getScoreColor}
        />
      )}
    </motion.div>
  );
};

export default ResultsPanel;