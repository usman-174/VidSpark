// components/ComparisonCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitCompare, TrendingUp, TrendingDown, Minus, Info, Eye, Star, Users, Activity } from "lucide-react";
import { ComparisonData } from "./types";

interface ComparisonCardProps {
  comparisonData: ComparisonData;
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({ comparisonData }) => {
  const { firstResult, secondResult, firstFormData, secondFormData } = comparisonData;

  const getComparisonIcon = (value1: number, value2: number) => {
    if (value1 > value2) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value1 < value2) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getBetterBadgeColor = (isWinner: boolean) => {
    return isWinner 
      ? "bg-green-100 text-green-800 border-green-300" 
      : "bg-gray-100 text-gray-600 border-gray-300";
  };

  const parseViews = (viewString: string): number => {
    const cleanString = viewString.replace(/[,\s]/g, '').toLowerCase();
    if (cleanString.includes('k')) {
      return parseFloat(cleanString) * 1000;
    } else if (cleanString.includes('m')) {
      return parseFloat(cleanString) * 1000000;
    } else if (cleanString.includes('b')) {
      return parseFloat(cleanString) * 1000000000;
    }
    return parseFloat(cleanString) || 0;
  };

  const firstViews = parseViews(firstResult.data.prediction.formatted_views);
  const secondViews = parseViews(secondResult.data.prediction.formatted_views);
  const firstScore = firstResult.data.content_score;
  const secondScore = secondResult.data.content_score;

  const firstIsWinner = firstScore > secondScore || (firstScore === secondScore && firstViews > secondViews);

  return (
    <div className="space-y-4">
      {/* Comparison Header */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Comparison Analysis:</strong> Side-by-side comparison of your two content variations.
        </AlertDescription>
      </Alert>

      {/* Main Comparison Card */}
      <Card className="shadow-lg border-2 border-purple-100">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-center">
            <GitCompare className="mr-2 h-6 w-6" />
            Content Comparison Results
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-2 divide-x">
            {/* First Result */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-gray-900">Content A</h3>
                <Badge className={getBetterBadgeColor(firstIsWinner)}>
                  {firstIsWinner ? "Winner" : "Alternative"}
                </Badge>
              </div>

              {/* Title Preview */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Title:</p>
                <p className="text-xs text-gray-600 line-clamp-2">{firstFormData.title}</p>
              </div>

              {/* Key Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">Predicted Views</span>
                  </div>
                  <div className="flex items-center">
                    {getComparisonIcon(firstViews, secondViews)}
                    <span className="ml-1 font-semibold text-blue-600">
                      {firstResult.data.prediction.formatted_views}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="text-sm text-gray-600">Content Score</span>
                  </div>
                  <div className="flex items-center">
                    {getComparisonIcon(firstScore, secondScore)}
                    <span className={`ml-1 font-semibold ${getScoreColor(firstScore)}`}>
                      {firstScore}/100
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">Viral Potential</span>
                  </div>
                  <span className="font-semibold text-gray-700">
                    {firstResult.data.insights?.performance_metrics?.viral_potential || "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Est. Engagement</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {(firstResult.data.insights?.performance_metrics?.estimated_engagement || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Second Result */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-gray-900">Content B</h3>
                <Badge className={getBetterBadgeColor(!firstIsWinner)}>
                  {!firstIsWinner ? "Winner" : "Alternative"}
                </Badge>
              </div>

              {/* Title Preview */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Title:</p>
                <p className="text-xs text-gray-600 line-clamp-2">{secondFormData.title}</p>
              </div>

              {/* Key Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">Predicted Views</span>
                  </div>
                  <div className="flex items-center">
                    {getComparisonIcon(secondViews, firstViews)}
                    <span className="ml-1 font-semibold text-blue-600">
                      {secondResult.data.prediction.formatted_views}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="text-sm text-gray-600">Content Score</span>
                  </div>
                  <div className="flex items-center">
                    {getComparisonIcon(secondScore, firstScore)}
                    <span className={`ml-1 font-semibold ${getScoreColor(secondScore)}`}>
                      {secondScore}/100
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">Viral Potential</span>
                  </div>
                  <span className="font-semibold text-gray-700">
                    {secondResult.data.insights?.performance_metrics?.viral_potential || "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Est. Engagement</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {(secondResult.data.insights?.performance_metrics?.estimated_engagement || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="border-t bg-gray-50 p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Key Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Performance Winner:</strong> Content {firstIsWinner ? 'A' : 'B'} 
                {firstScore !== secondScore && (
                  <span className="text-gray-600"> ({Math.abs(firstScore - secondScore)} point difference)</span>
                )}
              </div>
              <div>
                <strong>Views Difference:</strong> 
                <span className="text-gray-600">
                  {Math.abs(firstViews - secondViews).toLocaleString()} views
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparisonCard;