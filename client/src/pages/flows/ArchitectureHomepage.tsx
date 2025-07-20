import React from "react";
import { Youtube, BarChart3, Heart, Layers, ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ArchitectureHomepage = () => {
  const navigate = useNavigate();
  const navigateToFlow = (path: string) => {
    // window.location.href = path;
    navigate(path);
  };

  const flows = [
  {
    id: "high-level",
    title: "System Architecture",
    description: "Complete system overview with all components and data flow",
    icon: <Layers className="w-16 h-16" />,
    color: "from-gray-600 to-gray-800",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-300",
    textColor: "text-gray-800",
    path: "/arc"
  },
  {
    id: "title-generation",
    title: "Title Generator Flow",
    description: "YouTube title generation with AI and data analysis",
    icon: <Youtube className="w-16 h-16" />,
    color: "from-red-500 to-pink-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    textColor: "text-red-800",
    path: "/flow/title-generation"
  },
  {
    id: "content-evaluation",
    title: "Content Evaluation Flow",
    description: "ML-powered content analysis and performance prediction",
    icon: <BarChart3 className="w-16 h-16" />,
    color: "from-purple-500 to-indigo-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
    textColor: "text-purple-800",
    path: "/flow/content-evaluation"
  },
  {
    id: "sentiment-analysis",
    title: "Sentiment Analysis Flow",
    description: "AI sentiment analysis of video content and comments",
    icon: <Heart className="w-16 h-16" />,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    textColor: "text-green-800",
    path: "/flow/sentimental-analysis"
  },
  {
    id: "keyword-analysis",
    title: "Keyword Analysis Flow",
    description: "YouTube keyword research with competition analysis and AI insights",
    icon: <Search className="w-16 h-16" />,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    textColor: "text-blue-800",
    path: "/flow/keyword-analysis"
  }
];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Architecture Documentation
          </h1>
          <p className="text-lg text-gray-600">
            Explore the system architecture and detailed flow diagrams
          </p>
        </div>

        {/* Architecture Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {flows.map((flow) => (
            <div
              key={flow.id}
              className={`${flow.bgColor} border-2 ${flow.borderColor} rounded-lg p-8 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg`}
              onClick={() => navigateToFlow(flow.path)}
            >
              <div className="text-center">
                <div
                  className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r ${flow.color} text-white mb-6`}
                >
                  {flow.icon}
                </div>
                <h3 className={`text-2xl font-bold ${flow.textColor} mb-3`}>
                  {flow.title}
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {flow.description}
                </p>
                <div
                  className={`flex items-center justify-center gap-2 ${flow.textColor} font-medium`}
                >
                  <span>View Details</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Simple Footer */}
        <div className="mt-16 text-center">
          <p className="text-gray-500">
            Click any card above to explore the architecture details
          </p>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureHomepage;
