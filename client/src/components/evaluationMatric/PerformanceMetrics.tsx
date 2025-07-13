// components/PerformanceMetrics.tsx
import React from 'react';
import { Star, Users } from "lucide-react";
import { PerformanceMetrics } from "./types";

interface PerformanceMetricsProps {
  metrics: PerformanceMetrics;
  getViralPotentialColor: (potential: string) => string;
}

const PerformanceMetricsComponent: React.FC<PerformanceMetricsProps> = ({
  metrics,
  getViralPotentialColor,
}) => {
  return (
    <div className="grid grid-cols-3 gap-4 pt-4">
      <div className="text-center">
        <div className="flex items-center justify-center mb-1">
          <Star className="h-4 w-4 text-yellow-500 mr-1" />
          <span className={`font-bold ${getViralPotentialColor(metrics.viral_potential)}`}>
            {metrics.viral_potential}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          Viral Potential
        </div>
      </div>

      <div className="text-center"></div>

      <div className="text-center">
        <div className="flex items-center justify-center mb-1">
          <Users className="h-4 w-4 text-green-500 mr-1" />
          <span className="font-bold text-green-600">
            {metrics.estimated_engagement.toLocaleString()}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          Est. Engagement
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetricsComponent;