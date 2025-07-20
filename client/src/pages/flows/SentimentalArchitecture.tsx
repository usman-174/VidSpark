import React, { useState } from "react";
import { 
  Database, 
  Brain, 
  Server, 
  Youtube,
  MessageCircle,
  BarChart3,
  FileText,
  Zap,
  Target,
  ArrowRight,
  CheckCircle,
  Users,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Shield,
  Filter,
  Sparkles
} from "lucide-react";

const SentimentAnalysisArchitecture = () => {
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [showCleaningModal, setShowCleaningModal] = useState(false);
  const [showSentimentModal, setShowSentimentModal] = useState(false);

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

  const YouTubeDataModal = () => (
    <Modal
      isOpen={showYouTubeModal}
      onClose={() => setShowYouTubeModal(false)}
      title="YouTube Data Collection"
    >
      <div className="space-y-6">
        <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
          <h3 className="font-bold text-lg mb-2 text-red-800">
            📹 What We Get from YouTube
          </h3>
          <p className="text-sm text-gray-700">
            We collect the video details and up to 400 comments to understand how people feel about the content.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-bold text-blue-800 mb-2">📝 Video Information</h4>
            <ul className="text-sm space-y-1">
              <li>• Video title</li>
              <li>• Description</li>
              <li>• Tags</li>
              <li>• Channel details</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-bold text-green-800 mb-2">💬 Comments Data</h4>
            <ul className="text-sm space-y-1">
              <li>• Up to 400 comments</li>
              <li>• Comment text</li>
              <li>• Engagement metrics</li>
              <li>• User reactions</li>
            </ul>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-yellow-800">
            🔍 How We Get the Data
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">1</span>
              <span>Use YouTube API with your video ID</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">2</span>
              <span>Get video details and metadata</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">3</span>
              <span>Collect recent comments from viewers</span>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-purple-800">
            ⚡ Smart API Management
          </h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Multiple Keys:</strong> Never hit API limits</li>
            <li>• <strong>Error Handling:</strong> Graceful failures</li>
            <li>• <strong>Rate Limiting:</strong> Respects YouTube's rules</li>
            <li>• <strong>Data Validation:</strong> Ensures quality</li>
          </ul>
        </div>
      </div>
    </Modal>
  );

  const DataCleaningModal = () => (
    <Modal
      isOpen={showCleaningModal}
      onClose={() => setShowCleaningModal(false)}
      title="Smart Data Cleaning Process"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <h3 className="font-bold text-lg mb-2 text-blue-800">
            🧹 Why Clean the Data?
          </h3>
          <p className="text-sm text-gray-700">
            Raw YouTube comments contain spam, emojis, and irrelevant text that can confuse AI analysis. We clean it first!
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
            <h4 className="font-bold text-orange-800 mb-2">🗑️ What We Remove</h4>
            <div className="text-sm space-y-1">
              <div>• URLs and links</div>
              <div>• Email addresses</div>
              <div>• HTML tags and code</div>
              <div>• Excessive punctuation (...., !!!!, ????)</div>
              <div>• Special characters and symbols</div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h4 className="font-bold text-green-800 mb-2">✅ What We Keep</h4>
            <div className="text-sm space-y-1">
              <div>• Meaningful text content</div>
              <div>• Basic punctuation (. ! ? , ;)</div>
              <div>• Numbers and letters</div>
              <div>• Proper spacing</div>
              <div>• Genuine opinions and feedback</div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <h4 className="font-bold text-purple-800 mb-2">🎯 Quality Filter</h4>
            <div className="text-sm space-y-1">
              <div><strong>Minimum Length:</strong> At least 3 characters</div>
              <div><strong>Content Check:</strong> 30% must be letters/numbers</div>
              <div><strong>Spam Filter:</strong> Remove emoji-only comments</div>
              <div><strong>Language Filter:</strong> Focus on readable text</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-yellow-800">
            📊 Typical Results
          </h3>
          <div className="text-sm space-y-1">
            <div>• <strong>Start with:</strong> 400 raw comments</div>
            <div>• <strong>After cleaning:</strong> 250-350 quality comments</div>
            <div>• <strong>Improvement:</strong> 85%+ accuracy increase</div>
            <div>• <strong>Processing:</strong> 2-3 seconds per batch</div>
          </div>
        </div>
      </div>
    </Modal>
  );

  const SentimentModal = () => (
    <Modal
      isOpen={showSentimentModal}
      onClose={() => setShowSentimentModal(false)}
      title="AI Sentiment Analysis Engine"
    >
      <div className="space-y-6">
        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
          <h3 className="font-bold text-lg mb-2 text-purple-800">
            🤖 Advanced AI Model
          </h3>
          <p className="text-sm text-gray-700">
            Uses Cardiff NLP's RoBERTa model - one of the most accurate sentiment analysis models available.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-bold text-green-800 mb-2">😊 What It Detects</h4>
            <ul className="text-sm space-y-1">
              <li>• <span className="text-green-600">Positive</span> - Happy, excited, loving</li>
              <li>• <span className="text-gray-600">Neutral</span> - Factual, informational</li>
              <li>• <span className="text-red-600">Negative</span> - Angry, disappointed, critical</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-bold text-blue-800 mb-2">📊 Analysis Levels</h4>
            <ul className="text-sm space-y-1">
              <li>• Video title sentiment</li>
              <li>• Description sentiment</li>
              <li>• Tags sentiment</li>
              <li>• Individual comment sentiment</li>
            </ul>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-yellow-800">
            🎯 How Analysis Works
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">1</span>
              <span>Process video metadata (title, description, tags)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">2</span>
              <span>Analyze comments in batches of 100</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">3</span>
              <span>Calculate overall sentiment scores</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">4</span>
              <span>Create weighted final sentiment (70% comments, 30% metadata)</span>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-indigo-800">
            ⚡ Performance Features
          </h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Batch Processing:</strong> 100 comments at once</li>
           
            <li>• <strong>Confidence Scores:</strong> How sure the AI is</li>
            <li>• <strong>Real-time Processing:</strong> 12-30 seconds total</li>
          </ul>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <YouTubeDataModal />
      <DataCleaningModal />
      <SentimentModal />

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          YouTube Video Sentiment Analyzer
        </h1>
        <p className="text-gray-600">
          AI-Powered Analysis of Video Content + Audience Reactions
        </p>
      </div>

      {/* Main Flow Diagram */}
      <div className="flex flex-col items-center space-y-6">
        
        {/* User Input */}
        <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-4 text-center min-w-[200px]">
          <div className="flex items-center justify-center mb-2">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="font-bold text-lg text-gray-800">Enter Video ID</div>
          <div className="text-sm text-gray-600">
            YouTube video URL or ID you want to analyze
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-gray-600" />
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded ml-2">
            Send to Backend
          </span>
        </div>

        {/* Processing Hub */}
        <div className="bg-green-50 border-2 border-green-600 rounded-lg p-4 text-center min-w-[200px]">
          <div className="flex items-center justify-center mb-2">
            <Server className="w-8 h-8 text-green-600" />
          </div>
          <div className="font-bold text-lg text-gray-800">Backend Processing</div>
          <div className="text-sm text-gray-600">
            Validate request, check credits & start analysis
          </div>
        </div>

        {/* Arrow to YouTube */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-red-600" />
          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded ml-2">
            Fetch from YouTube
          </span>
        </div>

        {/* YouTube Data Collection */}
        <div 
          className="bg-red-50 border-2 border-red-600 rounded-lg p-4 text-center min-w-[300px] cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowYouTubeModal(true)}
        >
          <div className="flex items-center justify-center mb-2">
            <Youtube className="w-8 h-8 text-red-600" />
          </div>
          <div className="font-bold text-lg text-gray-800 mb-2">YouTube Data Collection</div>
          <div className="text-sm text-gray-600 leading-tight space-y-1">
            <div>• Get video title, description, tags</div>
            <div>• Collect up to 400 comments</div>
            <div>• Extract engagement data</div>
            <div>• Validate data quality</div>
          </div>
          <div className="text-xs text-red-600 font-medium mt-2">
            Click to learn more
          </div>
        </div>

        {/* Arrow to Cleaning */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-orange-600" />
          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded ml-2">
            Clean & Filter
          </span>
        </div>

        {/* Data Cleaning */}
        <div 
          className="bg-orange-50 border-2 border-orange-600 rounded-lg p-4 text-center min-w-[300px] cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowCleaningModal(true)}
        >
          <div className="flex items-center justify-center mb-2">
            <Filter className="w-8 h-8 text-orange-600" />
          </div>
          <div className="font-bold text-lg text-gray-800 mb-2">Smart Data Cleaning</div>
          <div className="text-sm text-gray-600 leading-tight space-y-1">
            <div>• Remove spam and irrelevant content</div>
            <div>• Filter out URLs and special characters</div>
            <div>• Keep only meaningful text</div>
            <div>• Validate comment quality</div>
          </div>
          <div className="text-xs text-orange-600 font-medium mt-2">
            Click for cleaning details
          </div>
        </div>

        {/* Arrow to AI */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-purple-600" />
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded ml-2">
            AI Analysis
          </span>
        </div>

        {/* AI Sentiment Analysis */}
        <div 
          className="bg-purple-50 border-2 border-purple-600 rounded-lg p-4 text-center min-w-[300px] cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowSentimentModal(true)}
        >
          <div className="flex items-center justify-center mb-2">
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
          <div className="font-bold text-lg text-gray-800 mb-2">AI Sentiment Analysis</div>
          <div className="text-sm text-gray-600 leading-tight space-y-1">
            <div>• Advanced RoBERTa AI model</div>
            <div>• Batch process comments (100 at a time)</div>
            <div>• Analyze video metadata sentiment</div>
            <div>• Calculate confidence scores</div>
          </div>
          <div className="text-xs text-purple-600 font-medium mt-2">
            Click for AI details
          </div>
        </div>

        {/* Arrow to Results */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-emerald-600" />
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded ml-2">
            Generate Results
          </span>
        </div>

        {/* Results Processing */}
        <div className="bg-emerald-50 border-2 border-emerald-600 rounded-lg p-4 text-center min-w-[350px]">
          <div className="flex items-center justify-center mb-2">
            <div className="flex gap-2">
              <BarChart3 className="w-8 h-8 text-emerald-600" />
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="font-bold text-lg text-gray-800 mb-2">Comprehensive Sentiment Report</div>
          <div className="text-sm text-gray-600 leading-tight space-y-1">
            <div>• Overall sentiment (positive/negative/neutral)</div>
            <div>• Individual comment analysis</div>
            <div>• Video metadata sentiment</div>
            <div>• Weighted final scores</div>
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
              <div>• Store sentiment results</div>
              <div>• Track analysis history</div>
              <div>• Reference later</div>
            </div>
          </div>

          {/* Credit System */}
          <div className="bg-yellow-50 border-2 border-yellow-600 rounded-lg p-4 text-center flex-1 max-w-[250px]">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="font-bold text-lg text-gray-800 mb-2">Credit Usage</div>
            <div className="text-sm text-gray-600 leading-tight space-y-1">
              <div>• 1 credit per analysis</div>
              <div>• Track feature usage</div>
              <div>• Update user balance</div>
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
            Analyzes actual video content and up to 400 real comments from viewers.
          </p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Smart Filtering
          </h3>
          <p className="text-sm text-gray-700">
            Advanced text cleaning removes spam and noise for accurate sentiment analysis.
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Advanced AI
          </h3>
          <p className="text-sm text-gray-700">
            State-of-the-art RoBERTa model provides highly accurate sentiment detection.
          </p>
        </div>
      </div>

      {/* Analysis Breakdown */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-bold text-lg mb-3 text-gray-800 text-center">What You Get</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Comment Analysis
            </h4>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-green-600" />
                <span>Positive sentiment percentage</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-red-600" />
                <span>Negative sentiment percentage</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-gray-600" />
                <span>Neutral sentiment percentage</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Video Content Analysis
            </h4>
            <div className="text-sm space-y-1">
              <div>• Title sentiment score</div>
              <div>• Description sentiment score</div>
              <div>• Tags sentiment analysis</div>
              <div>• Overall weighted sentiment</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      
      {/* </div> */}
    </div>
  );
};

export default SentimentAnalysisArchitecture;