import axiosInstance from "@/api/axiosInstance";
import { Video } from "@/api/videoApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPopularKeywords } from "@/lib/utils";
import { Clock, TrendingUp, Activity, BarChart2, Zap, Table } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import NewsReports from "@/pages/NewsReports";
import IdeasOfTheDay from "@/components/home/IdeasOfTheDay";

const Home = () => {
  const [trendingVideos, setTrendingVideos] = useState<any>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrendingVideos();
  }, []);

  const fetchTrendingVideos = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/videos/trending");
      setTrendingVideos(response.data);
      setKeywords(getPopularKeywords(response.data.videos));
    } catch (error) {
      console.error("Error fetching trending videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const VideoCard = ({ video }: { video: any }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
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
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-sm line-clamp-2 mb-2">{video.title}</h3>
        <div className="flex items-center text-sm text-gray-500">
          <span>{video.views} views</span>
          <span className="mx-2">•</span>
          <span>{video.uploadedAt}</span>
        </div>
        <div className="mt-2">
          <Link
            to={`/sentimental-analysis?videoId=${video.id}`}
            className="text-blue-500 hover:underline text-sm"
          >
            Analyze Sentiment
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Zap className="mr-2 h-5 w-5 text-yellow-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>Access main features quickly</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button asChild>
                <Link to="/title-generation">Generate Titles</Link>
              </Button>
              <Button asChild>
                <Link to="/sentimental-analysis">Sentiment Analysis</Link>
              </Button>
              <Button asChild>
                <Link to="/keyword-analysis">Keyword Analysis</Link>
              </Button>
              <Button asChild>
                <Link to="/evaluation-matrix">Evaluation Matrix</Link>
              </Button>
              <Button asChild>
                <Link to="/packages">View Packages</Link>
              </Button>
              <Button asChild>
                <Link to="/profile">Your Profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Activity className="mr-2 h-5 w-5 text-green-500" />
                Recent Activities
              </CardTitle>
              <CardDescription>What you've been up to recently</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">No recent activities to show.</p>
              {/* Placeholder: Implement recent activities fetching and display */}
            </CardContent>
          </Card>

          {/* Useful Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <BarChart2 className="mr-2 h-5 w-5 text-blue-500" />
                Useful Insights
              </CardTitle>
              <CardDescription>Summary and stats at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Insights will be available here.</p>
              {/* Placeholder: Implement insights charts or stats */}
            </CardContent>
          </Card>

          {/* Trending Videos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <TrendingUp className="mr-2 h-5 w-5 text-red-600" />
                Trending Videos
              </CardTitle>
              <CardDescription>Most popular videos right now</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <Skeleton className="w-48 h-28" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {trendingVideos?.videos?.map((video: Video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          {/* Popular Keywords */}
          <Card className="h-fit mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Popular Keywords</CardTitle>
              <CardDescription>Trending topics in recent videos</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="flex flex-wrap gap-2">
                  {isLoading
                    ? [...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="h-6 w-20" />
                      ))
                    : keywords.map((keyword) => (
                        <Badge
                          key={keyword}
                          variant="secondary"
                          className="px-3 py-1 text-sm cursor-pointer hover:bg-gray-100"
                        >
                          {keyword}
                        </Badge>
                      ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

         
          <IdeasOfTheDay />
        </div>
      </div>
    </div>
  );
};

export default Home;
