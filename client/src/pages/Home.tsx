import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Video } from "@/api/videoApi";
import {
  userInsightsAPI,
  DashboardInsights,
  UserRecommendations,
} from "@/api/userInsightsApi";
import { getPopularKeywords } from "@/lib/utils";

// Components
import WelcomeHeader from "@/components/home/WelcomeHeader";
import QuickActions from "@/components/home/QuickActions";
import InsightsOverview from "@/components/home/InsightsOverview";
import TrendingContent from "@/components/home/TrendingContent";
import Recommendations from "@/components/home/Recommendations";
import IdeasOfTheDay from "@/components/home/IdeasOfTheDay";

const Home = () => {
  // State management
  const [trendingVideos, setTrendingVideos] = useState<any>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [recommendations, setRecommendations] =
    useState<UserRecommendations | null>(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(true);

  useEffect(() => {
    // Load all data on component mount
    Promise.all([
      fetchTrendingVideos(),
      fetchDashboardInsights(),
      fetchRecommendations(),
    ]);
  }, []);

  const fetchTrendingVideos = async () => {
    try {
      setIsLoadingVideos(true);
      const response = await axiosInstance.get("/videos/trending");
      setTrendingVideos(response.data);
      setKeywords(getPopularKeywords(response.data.videos));
    } catch (error) {
      console.error("Error fetching trending videos:", error);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const fetchDashboardInsights = async () => {
    try {
      setIsLoadingInsights(true);
      const response = await userInsightsAPI.getDashboardInsights();
      if (response.success) {
        setInsights(response.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard insights:", error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setIsLoadingRecommendations(true);
      const response = await userInsightsAPI.getRecommendations();
      if (response.success) {
        setRecommendations(response.data);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Welcome Header */}
        <WelcomeHeader insights={insights} isLoading={isLoadingInsights} />

        {/* Quick Actions */}
        <QuickActions />
        {/* Personalized Recommendations */}
        <Recommendations
          recommendations={recommendations}
          isLoading={isLoadingRecommendations}
        />
        {/* Insights Overview */}
        <InsightsOverview insights={insights} isLoading={isLoadingInsights} />

        {/* Trending Content & Keywords */}
        <TrendingContent
          trendingVideos={trendingVideos}
          keywords={keywords}
          isLoading={isLoadingVideos}
        />
        {/* Ideas of the Day */}
      
          
       
      </div>
    </div>
  );
};

export default Home;
