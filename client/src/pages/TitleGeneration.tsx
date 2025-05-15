import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const TitleGeneration = () => {
  const [keyword, setKeyword] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");

  const handleGenerate = () => {
    if (!keyword.trim()) return;

    // Example title generation logic (replace with API call later)
    const title = `Top Tips for "${keyword}" You Can't Miss!`;
    setGeneratedTitle(title);
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <Card className="shadow-xl border border-gray-200 rounded-2xl p-6 bg-white">
        <CardHeader className="text-center">
          <CardTitle className="flex justify-center items-center text-2xl font-bold text-teal-700">
            <Sparkles className="mr-2 h-6 w-6 text-yellow-500 animate-bounce" />
            Title Generator
          </CardTitle>
          <p className="mt-2 text-gray-500 text-sm">
            Generate catchy video titles with AI-powered suggestions.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="keyword" className="text-sm font-medium text-gray-600">
              Enter Keyword
            </label>
            <Input
              id="keyword"
              placeholder="e.g., Digital Marketing"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg"
            />
          </div>

          <Button
            onClick={handleGenerate}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Generate Title
          </Button>

          {generatedTitle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-5 bg-teal-50 border border-teal-200 rounded-xl shadow-sm"
            >
              <p className="text-sm text-teal-800 font-medium mb-1">Generated Title</p>
              <h2 className="text-xl font-semibold text-teal-900">{generatedTitle}</h2>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TitleGeneration;
