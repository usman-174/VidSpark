import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, Search, Clock } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { getPopularKeywords } from "@/lib/utils";

const Home = () => {
  const [searchText, setSearchText] = useState("");
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
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
      setKeywords(getPopularKeywords(response.data));
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
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Generate video title..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>Generate</Button>
          </div> */}

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
                  {trendingVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <Card className="h-fit">
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
                        onClick={() => setSearchText(keyword)}
                      >
                        {keyword}
                      </Badge>
                    ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
