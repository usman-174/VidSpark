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
import {
  Clock,
  TrendingUp,
  Activity,
  BarChart2,
  Zap,
  Newspaper,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface NewsIdea {
  id: string;
  title: string;
  link: string;
  publishedAt: string;
}

const Home = () => {
  const [trendingVideos, setTrendingVideos] = useState<any>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newsIdeas, setNewsIdeas] = useState<NewsIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    fetchTrendingVideos();
    fetchNewsIdeas();
  }, []);

  const fetchTrendingVideos = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/videos/trending");
      setTrendingVideos(response.data);
      setKeywords(getPopularKeywords(response.data));
    } catch (error) {
      console.error("Error fetching trending videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNewsIdeas = async () => {
    try {
      setNewsLoading(true);
      const response = await axiosInstance.get("/news-ideas");
      setNewsIdeas(response.data.news || []);
    } catch (error) {
      console.error("Error fetching news ideas:", error);
    } finally {
      setNewsLoading(false);
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
              <Button asChild><Link to="/title-generation">Generate Titles</Link></Button>
              <Button asChild><Link to="/sentimental-analysis">Sentiment Analysis</Link></Button>
              <Button asChild><Link to="/keyword-analysis">Keyword Analysis</Link></Button>
              <Button asChild><Link to="/packages">View Packages</Link></Button>
              <Button asChild><Link to="/profile">Your Profile</Link></Button>
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
        <div className="space-y-6">
          {/* Popular Keywords */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Popular Keywords</CardTitle>
              <CardDescription>Trending topics in recent videos</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px] pr-4">
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

          {/* News Ideas */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Newspaper className="mr-2 h-5 w-5 text-indigo-500" />
                News Ideas
              </CardTitle>
              <CardDescription>Fresh daily ideas from news headlines</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4 space-y-2">
                {newsLoading ? (
                  [...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))
                ) : newsIdeas.length === 0 ? (
                  <p className="text-gray-600 text-sm">No news available.</p>
                ) : (
                  newsIdeas.map((news) => (
                    <a
                      key={news.id}
                      href={news.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-600 hover:underline"
                    >
                      {news.title}
                    </a>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
