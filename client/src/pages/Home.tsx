import React, { useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import thumbnailA from "../assets/a.jpg"; // Image for first video
import thumbnailB from "../assets/b.png"; // Image for second video
import thumbnailC from "../assets/c.png"; // Image for third video

const Home: React.FC = () => {
  const { logout, isAuthenticated, user } = useAuthStore();

  // Dummy data for trending videos and keywords
  const [trendingVideos, setTrendingVideos] = useState<any[]>([
    {
      id: "1",
      title: "How to learn React JS in 2023",
      views: "1.2M",
      thumbnail: thumbnailA, // Image for first video
    },
    {
      id: "2",
      title: "JavaScript ES6 Features Explained",
      views: "500K",
      thumbnail: thumbnailB, // Image for second video
    },
    {
      id: "3",
      title: "CSS Grid Layout Guide",
      views: "800K",
      thumbnail: thumbnailC, // Image for third video
    },
  ]);

  const [trendingKeywords, setTrendingKeywords] = useState<any[]>([
    { keyword: "React JS", views: "1.2M" },
    { keyword: "JavaScript", views: "500K" },
    { keyword: "CSS Grid", views: "800K" },
    { keyword: "Frontend Development", views: "300K" },
    { keyword: "Web Design", views: "1M" },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-8">
      {/* Main Content */}
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8 space-y-6">
        {/* Header Section with Search Bar and Welcome Section */}
        <div className="flex justify-between items-center mb-8">
          {/* Search Bar */}
          <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2 w-1/2">
            <input
              type="text"
              placeholder="Generate Title"
              className="outline-none w-full text-sm"
            />
            <button className="ml-2 text-gray-500">
              <i className="fas fa-search"></i> {/* Search Icon */}
            </button>
          </div>

          {/* Welcome Message and Logout */}
          {isAuthenticated && (
            <div className="text-right">
              <p className="text-xl font-semibold text-gray-800">
                Welcome back, <span className="text-teal-600">{user?.email}</span>!
              </p>
              <button
                onClick={logout}
                className="mt-2 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Trending Videos and Trending Keywords Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Trending Videos Section */}
          <div>
            <h3 className="text-lg font-semibold text-red-700 mb-4">Trending Videos</h3>
            <div className="space-y-4">
              {trendingVideos.map((video) => (
                <div key={video.id} className="flex items-center space-x-4 border-b pb-4">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-32 h-20 object-cover rounded-md" // Adjusted width and height
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{video.title}</p>
                    <p className="text-xs text-gray-500">{video.views} views</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Keywords Section (Table Format) */}
          <div className="mt-12 ml-10">
            <div className="overflow-x-auto">
              <table className="min-w-[300px] table-auto border-collapse bg-gray-50">
                <thead>
                  <tr className="bg-gray-200 text-center">
                    <th
                      className="px-4 py-2 text-gray-600 text-sm font-semibold"
                      colSpan={2}
                    >
                      Trending Keywords
                    </th>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-sm text-gray-600">Keyword</th>
                    <th className="px-2 py-1 text-left text-sm text-gray-600">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {trendingKeywords.map((keyword, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-2 py-1 text-gray-800 text-sm">{keyword.keyword}</td>
                      <td className="px-2 py-1 text-gray-600 text-sm">{keyword.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
