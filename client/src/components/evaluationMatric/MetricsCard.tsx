// / components/MetricsCard.tsx
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface MetricsCardProps {
  formattedViews: string;
  confidence: string;
  contentScore: number;
  performanceCategory: string;
  getScoreBadgeColor: (score: number) => string;
  getPerformanceCategoryIcon: (category: string) => React.ReactNode;
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  formattedViews,
  confidence,
  contentScore,
  performanceCategory,
  getScoreBadgeColor,
  getPerformanceCategoryIcon,
}) => {
  return (
    <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Eye className="mr-2 h-6 w-6" />
          <span className="text-xl font-semibold">Analysis Results</span>
        </div>
        <Badge className={`${getScoreBadgeColor(contentScore)} border`}>
          Score: {contentScore}/100
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-white/10 rounded-lg">
          <div className="text-2xl font-bold">
            {formattedViews}
          </div>
          <div className="text-sm opacity-90">
            Predicted Views
          </div>
          <div className="text-xs opacity-75 mt-1">
            Confidence: {confidence}
          </div>
        </div>

        <div className="text-center p-4 bg-white/10 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            {getPerformanceCategoryIcon(performanceCategory)}
            <span className="ml-2 text-lg font-bold">
              {performanceCategory}
            </span>
          </div>
          <div className="text-sm opacity-90">
            Performance Category
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;