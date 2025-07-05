import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video } from "@/api/videoApi";
import { Link } from "react-router-dom";
import { Clock, TrendingUp, Eye, ExternalLink } from "lucide-react";

interface TrendingContentProps {
  trendingVideos: any;
  keywords: string[];
  isLoading: boolean;
}

const VideoCard = ({ video }: { video: Video }) => (
  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
    <div className="aspect-video relative">
      <img
        src={video.thumbnail}
        alt={video.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded text-xs text-white">
        <Clock className="w-3 h-3 inline mr-1" />
        {video.duration}
      </div>
      <div className="absolute top-2 left-2 bg-red-500 bg-opacity-90 px-2 py-1 rounded text-xs text-white font-semibold">
        TRENDING
      </div>
    </div>
    <CardContent className="p-4">
      <h3 className="font-medium text-sm line-clamp-2 mb-2 hover:text-blue-600 transition-colors">
        {video.title}
      </h3>
      <div className="flex items-center text-sm text-gray-500 mb-3">
        <Eye className="w-4 h-4 mr-1" />
        <span>{video.views} views</span>
        <span className="mx-2">•</span>
        <span>{video.uploadedAt}</span>
      </div>
      <div className="flex space-x-2">
        <Link
          to={`/sentimental-analysis?videoId=${video.id}`}
          className="flex items-center text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Analyze Sentiment
        </Link>
      </div>
    </CardContent>
  </Card>
);

const TrendingContent = ({ trendingVideos, keywords, isLoading }: TrendingContentProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trending Videos Loading */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-video w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Keywords Loading */}
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-20" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Trending Videos */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <TrendingUp className="mr-2 h-5 w-5 text-red-500" />
              Trending Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendingVideos?.videos?.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {trendingVideos.videos.slice(0, 6).map((video: Video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No trending videos available at the moment.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular Keywords */}
      <div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Popular Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {keywords.length > 0 ? (
                  keywords.map((keyword, index) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="mr-2 mb-2 px-3 py-1 text-sm cursor-pointer hover:bg-gray-200 transition-colors inline-flex items-center"
                    >
                      <span className="text-xs text-gray-500 mr-2">#{index + 1}</span>
                      {keyword}
                    </Badge>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Badge variant="outline" className="mb-4">
                      No keywords available
                    </Badge>
                    <p className="text-sm">Keywords will appear here based on trending content.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrendingContent;