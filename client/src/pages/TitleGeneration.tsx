import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { titlesAPI } from "@/api/titlesApi";
import useAuthStore from "@/store/authStore";

const TitleGeneration = () => {
  const { user } = useAuthStore();

  const [keyword, setKeyword] = useState("");
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Helper function to parse potentially malformed responses
  const extractTitlesFromResponse = (response: any): string[] => {
    try {
      // Case 1: If we have a proper title.titles array
      if (response?.title?.titles && Array.isArray(response.title.titles)) {
        return response.title.titles
          .filter(
            (t: string) =>
              typeof t === "string" &&
              !t.startsWith("```") &&
              !t.startsWith("{") &&
              !t.startsWith("[")
          )
          .slice(0, 5);
      }

      // Case 2: If we have a titles array directly
      if (response?.titles && Array.isArray(response.titles)) {
        return response.titles.slice(0, 5);
      }

      // Case 3: If we get a string that might contain code or JSON
      if (typeof response?.title === "string") {
        const lines = response.title
          .split("\n")
          .map((line: string) => line.trim())
          .filter(
            (line: string) =>
              line &&
              !line.startsWith("```") &&
              !line.startsWith("{") &&
              !line.startsWith("}") &&
              !line.startsWith("[") &&
              !line.startsWith("]")
          );

        return lines.slice(0, 5);
      }

      // If all else fails, try to extract any strings we can find
      const allPossibleTitles: string[] = [];

      const extractStrings = (obj: any) => {
        if (!obj) return;

        if (typeof obj === "string") {
          // Clean up the string and add if it looks like a title
          const cleaned = obj.trim();
          if (
            cleaned.length > 10 &&
            cleaned.length < 100 &&
            !cleaned.startsWith("```") &&
            !cleaned.startsWith("{")
          ) {
            allPossibleTitles.push(cleaned);
          }
          return;
        }

        if (typeof obj === "object") {
          for (const key in obj) {
            extractStrings(obj[key]);
          }
        }
      };

      extractStrings(response);
      return allPossibleTitles.slice(0, 5);
    } catch (e) {
      console.error("Error parsing titles:", e);
      return [];
    }
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) return;

    if (user?.creditBalance === 0) {
      setError("Insufficient credits to agenerate titles.");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedTitles([]);

    try {
      const result = await titlesAPI.generateTitles({
        prompt: keyword,
      });

      // Try to extract titles from the response
      const extractedTitles = extractTitlesFromResponse(result);

      if (extractedTitles.length > 0) {
        setGeneratedTitles(extractedTitles);
      } else {
        // If we couldn't extract any titles, show an error
        setError("Could not parse titles from the response. Please try again.");
        console.error("Malformed response:", result);
      }
    } catch (error) {
      console.error("Error generating titles:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (title: string, index: number) => {
    navigator.clipboard.writeText(title);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
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
            Generate catchy SEO-optimized titles with AI-powered suggestions.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="keyword"
              className="text-sm font-medium text-gray-600"
            >
              Describe your content
            </label>
            <Input
              id="keyword"
              placeholder="e.g., A blog post about digital marketing trends in 2025"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !keyword.trim()}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>Generate Titles</>
            )}
          </Button>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          {generatedTitles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-teal-50 border border-teal-200 rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-4 border-b border-teal-200 bg-teal-100/50">
                <h3 className="text-teal-800 font-medium">Generated Titles</h3>
                <p className="text-xs text-teal-600">
                  Click on a title to copy
                </p>
              </div>
              <div className="divide-y divide-teal-100">
                {generatedTitles.map((title, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 hover:bg-teal-100/30 transition-colors cursor-pointer flex justify-between items-center group"
                    onClick={() => handleCopy(title, index)}
                  >
                    <p className="text-gray-800 font-medium pr-2">{title}</p>
                    <div className="text-teal-500">
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TitleGeneration;
