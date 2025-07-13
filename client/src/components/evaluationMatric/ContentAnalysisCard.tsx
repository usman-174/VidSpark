// / components/ContentAnalysisCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { ContentAnalysis } from "./types";

interface ContentAnalysisCardProps {
  analysis: ContentAnalysis;
  getScoreColor: (score: number) => string;
}

const ContentAnalysisCard: React.FC<ContentAnalysisCardProps> = ({
  analysis,
  getScoreColor,
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Activity className="mr-2 h-5 w-5 text-indigo-500" />
          Content Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Title Analysis */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Badge variant="outline" className="mr-2">
                Title
              </Badge>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Length:</span>
                <span className={analysis.title.optimal_length ? "text-green-600" : "text-yellow-600"}>
                  {analysis.title.length} chars
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Words:</span>
                <span>{analysis.title.word_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Has Numbers:</span>
                <span className={analysis.title.has_numbers ? "text-green-600" : "text-gray-600"}>
                  {analysis.title.has_numbers ? "Yes" : "No"}
                </span>
              </div>
              {analysis.title.capitalization_score && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Capitalization:</span>
                  <span className={getScoreColor(analysis.title.capitalization_score)}>
                    {Math.round(analysis.title.capitalization_score)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description Analysis */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Badge variant="outline" className="mr-2">
                Description
              </Badge>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Length:</span>
                <span className={analysis.description.optimal_length ? "text-green-600" : "text-yellow-600"}>
                  {analysis.description.length} chars
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Words:</span>
                <span>{analysis.description.word_count}</span>
              </div>
              {analysis.description.readability_score && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Readability:</span>
                  <span className={getScoreColor(analysis.description.readability_score)}>
                    {Math.round(analysis.description.readability_score)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tags Analysis */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Badge variant="outline" className="mr-2">
                Tags
              </Badge>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Count:</span>
                <span className={analysis.tags.optimal_count ? "text-green-600" : "text-yellow-600"}>
                  {analysis.tags.count}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Length:</span>
                <span>{Math.round(analysis.tags.avg_tag_length)} chars</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentAnalysisCard;