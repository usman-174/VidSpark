// components/LoadingState.tsx
import React from 'react';
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const LoadingState: React.FC = () => {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card className="h-64 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Analyzing Content
            </h3>
            <p className="text-sm text-gray-500">
              This may take a few seconds...
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default LoadingState;