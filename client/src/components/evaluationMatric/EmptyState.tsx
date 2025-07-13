// components/EmptyState.tsx
import React from 'react';
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const EmptyState: React.FC = () => {
  return (
    <motion.div
      key="placeholder"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Card className="h-64 flex items-center justify-center">
        <div className="text-center space-y-4">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Ready to Analyze
            </h3>
            <p className="text-sm text-gray-500">
              Enter your content details to get AI-powered insights
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default EmptyState;