import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import useAuthStore from "@/store/authStore";
import {
  AlertCircle,
  Check,
  Clipboard,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface VideoAnalysisFormProps {
  videoId: string;
  setVideoId: (id: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  error: string;
  videoTitle?: string;
}

const VideoAnalysisForm = ({
  videoId,
  setVideoId,
  onAnalyze,
  loading,
  error,
  videoTitle,
}: VideoAnalysisFormProps) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState("");

  const hasCredits = user?.creditBalance ? user.creditBalance > 0 : false;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleBuyCredits = () => {
    navigate("/packages");
  };

  const handleAnalyze = () => {
    if (!hasCredits) {
      toast.error(
        "You have no credits left. Please purchase more to analyze videos."
      );
      return;
    }
    onAnalyze();
  };

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Analyze Video</CardTitle>
        <CardDescription>
          Enter a YouTube video ID to analyze sentiments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter YouTube Video ID"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              className={`flex-1 ${!hasCredits ? "opacity-75" : ""}`}
              disabled={!hasCredits}
            />
            <Button
              onClick={handleAnalyze}
              disabled={loading || !videoId.trim() || !hasCredits}
              className={`min-w-[120px] ${
                hasCredits
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing
                </>
              ) : !hasCredits ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  No Credits
                </>
              ) : (
                "Analyze"
              )}
            </Button>
          </div>

          {/* Credits Indicator */}
          {!hasCredits && user?.id && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 rounded-full p-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-amber-800 text-sm font-medium">
                    No Credits Available
                  </p>
                  <p className="text-amber-700 text-xs mt-1">
                    You need credits to perform video analysis. Purchase credits
                    to continue.
                  </p>
                  <Button
                    onClick={handleBuyCredits}
                    size="sm"
                    className="mt-2 bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5"
                  >
                    Buy Credits
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Low Credits Warning */}
          {hasCredits &&
            user?.creditBalance &&
            user.creditBalance <= 5 &&
            user.creditBalance > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 rounded-full p-1.5">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-orange-800 text-sm font-medium">
                      Low Credits Warning
                    </p>
                    <p className="text-orange-700 text-xs mt-1">
                      You have {user.creditBalance} credits remaining. Consider
                      purchasing more to avoid interruption.
                    </p>
                    <Button
                      onClick={handleBuyCredits}
                      variant="outline"
                      size="sm"
                      className="mt-2 border-orange-300 text-orange-700 hover:bg-orange-100 text-xs px-3 py-1.5"
                    >
                      Buy More Credits
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

          {error && (
            <Alert variant="destructive">
              <div className="flex gap-2 items-center">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          )}

          {loading && !error && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}

          {user && (
            <div className="mt-2 text-sm text-gray-500 flex items-center justify-between">
              <span>
                Credits remaining:{" "}
                <span
                  className={`font-medium ${
                    !hasCredits
                      ? "text-red-600"
                      : user?.creditBalance && user.creditBalance <= 5
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {user.creditBalance || 0}
                </span>
              </span>
              {!hasCredits && (
                <Button
                  onClick={handleBuyCredits}
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1 h-6 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Buy Credits
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {videoTitle && (
        <CardFooter className="flex flex-col items-start">
          <div className="text-sm text-gray-700 mb-2">
            <span className="font-semibold">Video: </span>
            {videoTitle}
          </div>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="mr-2"
              onClick={() =>
                copyToClipboard(`https://www.youtube.com/watch?v=${videoId}`)
              }
            >
              {copied &&
              copiedText === `https://www.youtube.com/watch?v=${videoId}` ? (
                <Check className="h-3.5 w-3.5 mr-1" />
              ) : (
                <Clipboard className="h-3.5 w-3.5 mr-1" />
              )}
              Copy Link
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAnalyze}
              title="Refresh analysis"
              disabled={!hasCredits}
              className={!hasCredits ? "opacity-50 cursor-not-allowed" : ""}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default VideoAnalysisForm;
