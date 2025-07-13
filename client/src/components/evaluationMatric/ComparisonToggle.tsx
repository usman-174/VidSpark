// components/ComparisonToggle.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GitCompare, X } from "lucide-react";

interface ComparisonToggleProps {
  isComparisonMode: boolean;
  onToggleComparison: () => void;
  hasFirstResult: boolean;
}

const ComparisonToggle: React.FC<ComparisonToggleProps> = ({
  isComparisonMode,
  onToggleComparison,
  hasFirstResult,
}) => {
  return (
    <Card className="border-dashed border-2 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GitCompare className="h-5 w-5 text-blue-500" />
            <div>
              <h3 className="font-medium text-gray-900">Comparison Mode</h3>
              <p className="text-sm text-gray-600">
                {isComparisonMode 
                  ? "Compare two different content analyses" 
                  : "Enable to compare multiple content variations"
                }
              </p>
            </div>
          </div>
          <Button
            variant={isComparisonMode ? "destructive" : "outline"}
            size="sm"
            onClick={onToggleComparison}
            disabled={!hasFirstResult && !isComparisonMode}
          >
            {isComparisonMode ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Exit Comparison
              </>
            ) : (
              <>
                <GitCompare className="mr-2 h-4 w-4" />
                Compare Content
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparisonToggle;