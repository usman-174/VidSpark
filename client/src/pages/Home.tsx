import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { extractKeywordsFromVideos } from "@/lib/utils";
// import { extractKeywordsFromVideos } from "./";

const Home: React.FC = () => {
  const { logout, isAuthenticated, user } = useAuthStore();
  const [searchText, setSearchText] = useState("");
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [trendingKeywords, setTrendingKeywords] = useState<any[]>([]);

  useEffect(() => {
    fetchTrendingVideos();
  }, []);

  const fetchTrendingVideos = async () => {
    try {
      const response = await axiosInstance.get("/videos/trending");
      const videos = response.data;
      setTrendingVideos(videos);
      setTrendingKeywords(extractKeywordsFromVideos(videos));
    } catch (error) {
      console.error("Error fetching trending videos:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-start justify-center py-8">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-md p-8 space-y-8">
        <div className="mb-8">
          <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2 w-2/5">
            <input
              type="text"
              placeholder="Generate Title"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="outline-none w-full text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-red-700 mb-4">Trending Videos</h3>
            <div className="space-y-6">
              {trendingVideos.length === 0 ? (
                <p className="text-gray-500">No trending videos available.</p>
              ) : (
                trendingVideos.map((video) => (
                  <div key={video.id} className="flex items-center space-x-6 border-b pb-6">
                    <img src={video.thumbnail} alt={video.title} className="w-40 h-24 object-cover rounded-md" />
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{video.title}</p>
                      <p className="text-xs text-gray-500">{video.views} views</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <table className="min-w-[250px] table-auto border-collapse bg-gray-50 shadow-sm border">
              <thead>
                <tr className="bg-gray-100 text-center">
                  <th className="px-4 py-2 text-black text-sm font-bold" colSpan={2}>Trending Keywords</th>
                </tr>
                <tr>
                  <th className="px-4 py-2 text-left text-sm text-black">Keyword</th>
                  <th className="px-4 py-2 text-left text-sm text-black">Views</th>
                </tr>
              </thead>
              <tbody>
                {trendingKeywords.map((keyword, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-0.5 text-black text-xs">{keyword.keyword}</td>
                    <td className="px-4 py-0.5 text-black text-xs">{keyword.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
