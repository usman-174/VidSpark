import React, { useState } from "react";
import { 
  Database, 
  Brain, 
  Server, 
  Youtube,
  Search,
  BarChart3,
  FileText,
  Zap,
  Target,
  ArrowRight,
  CheckCircle,
  Users,
  TrendingUp,
  Eye,
  Lightbulb,
  Star,
  RefreshCw,
  Filter,
  Globe,
  Clock
} from "lucide-react";

const KeywordAnalysisArchitecture = () => {
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const lessThanArrow = '<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg>';
  const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    );
  };

  const YouTubeResearchModal = () => (
    <Modal
      isOpen={showYouTubeModal}
      onClose={() => setShowYouTubeModal(false)}
      title="YouTube Data Research Engine"
    >
      <div className="space-y-6">
        <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
          <h3 className="font-bold text-lg mb-2 text-red-800">
            🔍 Smart Video Discovery
          </h3>
          <p className="text-sm text-gray-700">
            Searches YouTube to find videos related to your keyword and analyzes their performance data.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-bold text-blue-800 mb-2">📊 Search Strategy</h4>
            <ul className="text-sm space-y-1">
              <li>• First: Last 30 days (recent trends)</li>
              <li>• Fallback: All-time search</li>
              <li>• Up to 50 videos per keyword</li>
              <li>• Relevance-based ordering</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-bold text-green-800 mb-2">📈 Data Collected</h4>
            <ul className="text-sm space-y-1">
              <li>• Video titles and descriptions</li>
              <li>• View counts and upload dates</li>
              <li>• Channel information</li>
              <li>• Tags and metadata</li>
            </ul>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-yellow-800">
            ⚡ Two-Step Process
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">1</span>
              <span>Search YouTube videos by keyword</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">2</span>
              <span>Get detailed statistics for each video</span>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-purple-800">
            🚀 Smart Features
          </h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>API Key Rotation:</strong> Never hit rate limits</li>
            <li>• <strong>Graceful Fallbacks:</strong> Always finds data</li>
            <li>• <strong>Batch Processing:</strong> Efficient data collection</li>
            <li>• <strong>Error Handling:</strong> Robust against failures</li>
          </ul>
        </div>
      </div>
    </Modal>
  );

  const AIInsightsModal = () => (
    <Modal
      isOpen={showAIModal}
      onClose={() => setShowAIModal(false)}
      title="AI-Powered Insights Generation"
    >
      <div className="space-y-6">
        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
          <h3 className="font-bold text-lg mb-2 text-purple-800">
            🧠 Smart AI Analysis
          </h3>
          <p className="text-sm text-gray-700">
            Combines YouTube data with AI to generate actionable insights for content creators.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h4 className="font-bold text-green-800 mb-2">🥇 Primary: Ollama (Local AI)</h4>
            <div className="text-sm space-y-1">
              <div><strong>Model:</strong> qwen3:4b</div>
              <div><strong>Advantage:</strong> Fast, private, no API costs</div>
              <div><strong>Response:</strong> 20-35 seconds</div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-orange-600">
              <span className="text-sm font-medium">If local AI fails...</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-bold text-blue-800 mb-2">🥈 Backup: OpenRouter (Cloud AI)</h4>
            <div className="text-sm space-y-1">
              <div><strong>Model:</strong> DeepSeek Chat</div>
              <div><strong>Advantage:</strong> Always available, reliable</div>
              <div><strong>Response:</strong> 15-30 seconds</div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-red-600">
              <span className="text-sm font-medium">If both AI services fail...</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
            <h4 className="font-bold text-orange-800 mb-2">🛡️ Fallback: Pre-made Insights</h4>
            <div className="text-sm space-y-1">
              <div><strong>Always works:</strong> Generic but useful advice</div>
              <div><strong>Instant:</strong> No waiting time</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-yellow-800">
            💡 What AI Analyzes
          </h3>
          <ul className="text-sm space-y-1">
            <li>• Competition levels and trends</li>
            <li>• Top performing video titles</li>
            <li>• Channel dominance patterns</li>
            <li>• Content gap opportunities</li>
          </ul>
        </div>
      </div>
    </Modal>
  );

  const AnalysisModal = () => (
    <Modal
      isOpen={showAnalysisModal}
      onClose={() => setShowAnalysisModal(false)}
      title="Keyword Analysis Engine"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <h3 className="font-bold text-lg mb-2 text-blue-800">
            📊 Advanced Analytics Processing
          </h3>
          <p className="text-sm text-gray-700">
            Processes YouTube data to generate comprehensive keyword insights and recommendations.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
            <h4 className="font-bold text-orange-800 mb-2">🎯 Competition Score</h4>
            <div className="text-sm space-y-1">
              <div><strong>Analysis:</strong> Recent video count vs average</div>
              <div><strong>Factors:</strong> Upload frequency, view distribution</div>
              <div><strong>Scale:</strong> 0-100 (0 = low competition)</div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h4 className="font-bold text-green-800 mb-2">📈 Trend Direction</h4>
            <div className="text-sm space-y-1">
              <div><strong>UP:</strong> 50% more recent videos than older</div>
              <div><strong>DOWN:</strong> 50% fewer recent videos</div>
              <div><strong>STABLE:</strong> Consistent upload pattern</div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <h4 className="font-bold text-purple-800 mb-2">🚀 Content Opportunity</h4>
            <div className="text-sm space-y-1">
              <div><strong>HIGH:</strong> Low competition + high views</div>
              <div><strong>MEDIUM:</strong> Moderate competition + decent views</div>
              <div><strong>LOW:</strong> High competition or low engagement</div>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
            <h4 className="font-bold text-indigo-800 mb-2">🏆 Top Channels</h4>
            <div className="text-sm space-y-1">
              <div><strong>Identifies:</strong> Most active channels for keyword</div>
              <div><strong>Helps:</strong> Understand competition landscape</div>
              <div><strong>Insight:</strong> Channel dominance patterns</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-yellow-800">
            📋 Final Report Includes
          </h3>
          <ul className="text-sm space-y-1">
            <li>• Competition score and trend analysis</li>
            <li>• Average views and engagement metrics</li>
            <li>• Content opportunity rating</li>
            <li>• Top 5 dominant channels</li>
            <li>• AI-generated actionable insights</li>
          </ul>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <YouTubeResearchModal />
      <AIInsightsModal />
      <AnalysisModal />

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          YouTube Keyword Analysis Engine
        </h1>
        <p className="text-gray-600">
          AI-Powered Keyword Research + Competition Analysis = Smart Content Strategy
        </p>
      </div>

      {/* Main Flow Diagram */}
      <div className="flex flex-col items-center space-y-6">
        
        {/* User Input */}
        <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-4 text-center min-w-[200px]">
          <div className="flex items-center justify-center mb-2">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="font-bold text-lg text-gray-800">Enter Keyword</div>
          <div className="text-sm text-gray-600">
            YouTube keyword or topic to analyze
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-gray-600" />
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded ml-2">
            Send to Backend
          </span>
        </div>

        {/* Backend Processing */}
        <div className="bg-green-50 border-2 border-green-600 rounded-lg p-4 text-center min-w-[200px]">
          <div className="flex items-center justify-center mb-2">
            <Server className="w-8 h-8 text-green-600" />
          </div>
          <div className="font-bold text-lg text-gray-800">Backend Validation</div>
          <div className="text-sm text-gray-600">
            Check credits, validate input & check cache
          </div>
        </div>

        {/* Cache Check */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-orange-600" />
          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded ml-2">
            Cache Check (6hr)
          </span>
        </div>

        {/* Cache Decision */}
        <div className="bg-orange-50 border-2 border-orange-600 rounded-lg p-4 text-center min-w-[250px]">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <div className="font-bold text-lg text-gray-800">Smart Caching</div>
          <div className="text-sm text-gray-600">
            If recent analysis exists (less than 6 hours), use cached data
          </div>
        </div>

        {/* Split Flow */}
        <div className="flex items-center justify-center w-full max-w-4xl">
          <div className="flex-1 flex flex-col items-center">
            <ArrowRight className="w-6 h-6 text-red-600 rotate-45" />
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded mt-1">
              Fresh Analysis
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <ArrowRight className="w-6 h-6 text-gray-600 -rotate-45" />
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded mt-1">
              Use Cache
            </span>
          </div>
        </div>

        {/* YouTube Research */}
        <div 
          className="bg-red-50 border-2 border-red-600 rounded-lg p-4 text-center min-w-[300px] cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowYouTubeModal(true)}
        >
          <div className="flex items-center justify-center mb-2">
            <Youtube className="w-8 h-8 text-red-600" />
          </div>
          <div className="font-bold text-lg text-gray-800 mb-2">YouTube Data Research</div>
          <div className="text-sm text-gray-600 leading-tight space-y-1">
            <div>• Search for keyword-related videos</div>
            <div>• Collect up to 50 video results</div>
            <div>• Get detailed video statistics</div>
            <div>• Smart fallback strategy</div>
          </div>
          <div className="text-xs text-red-600 font-medium mt-2">
            Click to learn more
          </div>
        </div>

        {/* Arrow to Analysis */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-purple-600" />
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded ml-2">
            Process Data
          </span>
        </div>

        {/* Data Analysis */}
        <div 
          className="bg-purple-50 border-2 border-purple-600 rounded-lg p-4 text-center min-w-[300px] cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowAnalysisModal(true)}
        >
          <div className="flex items-center justify-center mb-2">
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
          <div className="font-bold text-lg text-gray-800 mb-2">Keyword Analysis Engine</div>
          <div className="text-sm text-gray-600 leading-tight space-y-1">
            <div>• Calculate competition score</div>
            <div>• Analyze trend direction</div>
            <div>• Determine content opportunity</div>
            <div>• Identify top channels</div>
          </div>
          <div className="text-xs text-purple-600 font-medium mt-2">
            Click for analysis details
          </div>
        </div>

        {/* Arrow to AI */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-indigo-600" />
          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded ml-2">
            Generate Insights
          </span>
        </div>

        {/* AI Insights */}
        <div 
          className="bg-indigo-50 border-2 border-indigo-600 rounded-lg p-4 text-center min-w-[300px] cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowAIModal(true)}
        >
          <div className="flex items-center justify-center mb-2">
            <Brain className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="font-bold text-lg text-gray-800 mb-2">AI Insights Generation</div>
          <div className="text-sm text-gray-600 leading-tight space-y-1">
            <div>• Local AI (Ollama) - Primary</div>
            <div>• Cloud AI (OpenRouter) - Backup</div>
            <div>• Fallback insights - Emergency</div>
            <div>• 3 actionable recommendations</div>
          </div>
          <div className="text-xs text-indigo-600 font-medium mt-2">
            Click for AI details
          </div>
        </div>

        {/* Arrow to Results */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-emerald-600" />
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded ml-2">
            Compile Results
          </span>
        </div>

        {/* Final Results */}
        <div className="bg-emerald-50 border-2 border-emerald-600 rounded-lg p-4 text-center min-w-[350px]">
          <div className="flex items-center justify-center mb-2">
            <div className="flex gap-2">
              <Target className="w-8 h-8 text-emerald-600" />
              <Star className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="font-bold text-lg text-gray-800 mb-2">Complete Keyword Report</div>
          <div className="text-sm text-gray-600 leading-tight space-y-1">
            <div>• Competition score (0-100)</div>
            <div>• Trend direction (UP/DOWN/STABLE)</div>
            <div>• Content opportunity (HIGH/MEDIUM/LOW)</div>
            <div>• Top 5 competing channels</div>
            <div>• AI-generated actionable insights</div>
          </div>
        </div>

        {/* Arrow to Storage */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-gray-600" />
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded ml-2">
            Save & Track
          </span>
        </div>

        {/* Storage & Credits */}
        <div className="flex items-center justify-center space-x-8 w-full max-w-4xl">
          
          {/* Database Storage */}
          <div className="bg-gray-50 border-2 border-gray-600 rounded-lg p-4 text-center flex-1 max-w-[250px]">
            <div className="flex items-center justify-center mb-2">
              <Database className="w-8 h-8 text-gray-600" />
            </div>
            <div className="font-bold text-lg text-gray-800 mb-2">Save Analysis</div>
            <div className="text-sm text-gray-600 leading-tight space-y-1">
              <div>• Store keyword insights</div>
              <div>• Cache for 6 hours</div>
              <div>• Track search count</div>
            </div>
          </div>

          {/* Credit System */}
          <div className="bg-yellow-50 border-2 border-yellow-600 rounded-lg p-4 text-center flex-1 max-w-[250px]">
            <div className="flex items-center justify-center mb-2">
              <Zap className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="font-bold text-lg text-gray-800 mb-2">Credit Usage</div>
            <div className="text-sm text-gray-600 leading-tight space-y-1">
              <div>• 1 credit per analysis</div>
              <div>• Free if using cache</div>
              <div>• Track feature usage</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="mt-10 grid md:grid-cols-3 gap-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
            <Youtube className="w-5 h-5" />
            Real YouTube Data
          </h3>
          <p className="text-sm text-gray-700">
            Analyzes up to 50 real YouTube videos to understand keyword competition and trends.
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Advanced Analytics
          </h3>
          <p className="text-sm text-gray-700">
            Calculates competition scores, trend directions, and content opportunities automatically.
          </p>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h3 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI-Powered Insights
          </h3>
          <p className="text-sm text-gray-700">
            Triple fallback AI system generates actionable recommendations for content creators.
          </p>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-bold text-lg mb-3 text-gray-800 text-center">Analysis Capabilities</h3>
        <div className="grid md:grid-cols-4 gap-4 text-sm text-center">
          <div>
            <div className="text-2xl font-bold text-red-600">50</div>
            <div className="text-gray-600">Videos Analyzed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">6hrs</div>
            <div className="text-gray-600">Cache Duration</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600">3</div>
            <div className="text-gray-600">AI Insights</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">60s</div>
            <div className="text-gray-600">Analysis Time</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeywordAnalysisArchitecture;