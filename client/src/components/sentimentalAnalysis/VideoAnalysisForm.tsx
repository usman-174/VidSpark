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
  videoTitle 
}: VideoAnalysisFormProps) => {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState("");

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
              className="flex-1"
            />
            <Button
              onClick={onAnalyze}
              disabled={loading || !videoId.trim()}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing
                </>
              ) : (
                "Analyze"
              )}
            </Button>
          </div>

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
            <div className="mt-2 text-sm text-gray-500">
              Credits remaining:{" "}
              <span className="font-medium">
                {user.creditBalance || 0}
              </span>
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
                copyToClipboard(
                  `https://www.youtube.com/watch?v=${videoId}`
                )
              }
            >
              {copied &&
                copiedText ===
                `https://www.youtube.com/watch?v=${videoId}` ? (
                <Check className="h-3.5 w-3.5 mr-1" />
              ) : (
                <Clipboard className="h-3.5 w-3.5 mr-1" />
              )}
              Copy Link
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAnalyze}
              title="Refresh analysis"
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