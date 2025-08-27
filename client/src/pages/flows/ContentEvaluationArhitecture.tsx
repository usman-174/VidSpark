import React, { useState } from "react";
import { 
  Database, 
  Brain, 
  Server, 
  Code, 
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
  GitCompare,
  Shield
} from "lucide-react";

const ContentEvaluationArchitecture = () => {
  const [showMLModal, setShowMLModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

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

  const MLServiceModal = () => (
    <Modal
      isOpen={showMLModal}
      onClose={() => setShowMLModal(false)}
      title="Machine Learning Prediction Engine"
    >
      <div className="space-y-6">
        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
          <h3 className="font-bold text-lg mb-2 text-purple-800">
            🧠 XGBoost Machine Learning Model
          </h3>
          <p className="text-sm text-gray-700">
            Trained on thousands of YouTube videos to predict view counts based on content quality factors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-bold text-blue-800 mb-2">📊 What It Analyzes</h4>
            <ul className="text-sm space-y-1">
              <li>• Title word patterns</li>
              <li>• Description quality</li>
              <li>• Tag relevance</li>
              {/* <li>• Content structure</li> */}
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-bold text-green-800 mb-2">🎯 Predictions Made</h4>
            <ul className="text-sm space-y-1">
              <li>• Expected view count</li>
              <li>• Performance category</li>
              <li>• Viral potential</li>
              <li>• Confidence level</li>
            </ul>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-yellow-800">
            ⚡ How ML Processing Works
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">1</span>
              <span>Convert text to numerical features using TF-IDF</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">2</span>
              <span>Combine title, description, and tag vectors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">3</span>
              <span>Feed through trained XGBoost model</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">4</span>
              <span>Return prediction with confidence score</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-green-800">
            🚀 Performance Features
          </h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Fast Loading:</strong> Model cached in memory</li>
            <li>• <strong>Robust Processing:</strong> Handles various text lengths</li>
            <li>• <strong>Error Handling:</strong> Graceful fallbacks</li>
            <li>• <strong>Health Monitoring:</strong> Continuous system checks</li>
          </ul>
        </div>
      </div>
    </Modal>
  );

  const AnalysisModal = () => (
    <Modal
      isOpen={showAnalysisModal}
      onClose={() => setShowAnalysisModal(false)}
      title="Content Analysis & Insights Engine"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <h3 className="font-bold text-lg mb-2 text-blue-800">
            🔍 Deep Content Analysis
          </h3>
          <p className="text-sm text-gray-700">
            Goes beyond prediction to analyze every aspect of your content and provide actionable insights.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
            <h4 className="font-bold text-orange-800 mb-2">📝 Title Analysis</h4>
            <div className="text-sm space-y-1">
              <div><strong>Length Check:</strong> Optimal 5-12 words</div>
              <div><strong>Engagement Factors:</strong> Numbers, questions, capitalization</div>
              <div><strong>Psychology Score:</strong> Click-worthy elements</div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h4 className="font-bold text-green-800 mb-2">📄 Description Analysis</h4>
            <div className="text-sm space-y-1">
              <div><strong>Word Count:</strong> Optimal 50-200 words</div>
              <div><strong>Readability:</strong> Sentence structure analysis</div>
              <div><strong>SEO Score:</strong> Keyword optimization</div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <h4 className="font-bold text-purple-800 mb-2">🏷️ Tags Analysis</h4>
            <div className="text-sm space-y-1">
              <div><strong>Tag Count:</strong> Optimal 5-15 tags</div>
              <div><strong>Relevance:</strong> Topic alignment check</div>
              <div><strong>Balance:</strong> Broad vs specific tags</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-yellow-800">
            💡 Smart Recommendations
          </h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Personalized Tips:</strong> Based on your content</li>
            <li>• <strong>Performance Boost:</strong> Specific improvement areas</li>
            <li>• <strong>SEO Optimization:</strong> Better discoverability</li>
            <li>• <strong>Engagement Tactics:</strong> Proven strategies</li>
          </ul>
        </div>
      </div>
    </Modal>
  );

  const ComparisonModal = () => (
    <Modal
      isOpen={showComparisonModal}
      onClose={() => setShowComparisonModal(false)}
      title="A/B Testing & Comparison Mode"
    >
      <div className="space-y-6">
        <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
          <h3 className="font-bold text-lg mb-2 text-indigo-800">
            ⚖️ Compare Two Content Variations
          </h3>
          <p className="text-sm text-gray-700">
            Test different versions of your content to see which performs better before publishing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-bold text-blue-800 mb-2">🆚 What You Can Compare</h4>
            <ul className="text-sm space-y-1">
              <li>• Different title variations</li>
              <li>• Alternative descriptions</li>
              <li>• Tag strategies</li>
              <li>• Complete content rewrites</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-bold text-green-800 mb-2">📊 Comparison Metrics</h4>
            <ul className="text-sm space-y-1">
              <li>• Predicted views difference</li>
              <li>• Content scores</li>
              <li>• Performance categories</li>
              <li>• Recommendation differences</li>
            </ul>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-yellow-800">
            🔄 How Comparison Works
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">1</span>
              <span>Analyze your first content variation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">2</span>
              <span>Enter second variation for comparison</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">3</span>
              <span>Side-by-side results with clear winner</span>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-purple-800">
            ✨ Benefits of A/B Testing
          </h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Data-Driven Decisions:</strong> Choose based on predictions</li>
            <li>• <strong>Risk Reduction:</strong> Test before publishing</li>
            <li>• <strong>Optimization:</strong> Always pick the better version</li>
            <li>• <strong>Learning:</strong> Understand what works</li>
          </ul>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <MLServiceModal />
      <AnalysisModal />
      <ComparisonModal />

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Content Evaluation & Performance Predictor
        </h1>
        <p className="text-gray-600">
          AI-Powered Analysis + Machine Learning = Content That Performs
        </p>
      </div>

      {/* Main Flow Diagram */}
      <div className="flex flex-col items-center space-y-6">
        
        {/* User Input */}
        <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-4 text-center min-w-[200px]">
          <div className="flex items-center justify-center mb-2">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="font-bold text-lg text-gray-800">Enter Your Content</div>
          <div className="text-sm text-gray-600">
            Title, description, and tags for your YouTube video
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-gray-600" />
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded ml-2">
            Submit for Analysis
          </span>
        </div>

        {/* Processing Hub */}
        <div className="bg-green-50 border-2 border-green-600 rounded-lg p-4 text-center min-w-[200px]">
          <div className="flex items-center justify-center mb-2">
            <Server className="w-8 h-8 text-green-600" />
          </div>
          <div className="font-bold text-lg text-gray-800">Backend Validation</div>
          <div className="text-sm text-gray-600">
            Check credits, validate input & start processing
          </div>
        </div>

        {/* Arrow to ML Service */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-purple-600" />
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded ml-2">
            Send to ML Service
          </span>
        </div>

        {/* ML Processing */}
        <div 
          className="bg-purple-50 border-2 border-purple-600 rounded-lg p-4 text-center min-w-[300px] cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowMLModal(true)}
        >
          <div className="flex items-center justify-center mb-2">
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
          <div className="font-bold text-lg text-gray-800 mb-2">XGBoost ML Prediction</div>
          <div className="text-sm text-gray-600 leading-tight space-y-1">
            <div>• Text vectorization (TF-IDF)</div>
            <div>• Feature combination</div>
            <div>• View count prediction</div>
            <div>• Confidence scoring</div>
          </div>
          <div className="text-xs text-purple-600 font-medium mt-2">
            Click to learn more
          </div>
        </div>

        {/* Split to Analysis and Comparison */}
        <div className="flex items-center justify-center w-full max-w-4xl">
          <div className="flex-1 flex flex-col items-center">
            <ArrowRight className="w-6 h-6 text-orange-600 rotate-45" />
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded mt-1">
              Deep Analysis
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <ArrowRight className="w-6 h-6 text-indigo-600 -rotate-45" />
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded mt-1">
              Optional Comparison
            </span>
          </div>
        </div>

        {/* Analysis and Comparison Row */}
        <div className="flex items-start justify-center space-x-8 w-full max-w-4xl">
          
          {/* Content Analysis */}
          <div 
            className="bg-orange-50 border-2 border-orange-600 rounded-lg p-4 text-center flex-1 max-w-[280px] cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowAnalysisModal(true)}
          >
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
            <div className="font-bold text-lg text-gray-800 mb-2">Content Analysis</div>
            <div className="text-sm text-gray-600 leading-tight space-y-1">
              <div>• Title optimization score</div>
              <div>• Description quality</div>
              <div>• Tag effectiveness</div>
              <div>• Performance insights</div>
            </div>
            {/* <div className="text-xs text-orange-600 font-medium mt-2">
              Click for details
            </div> */}
          </div>

          {/* A/B Comparison */}
          <div 
            className="bg-indigo-50 border-2 border-indigo-600 rounded-lg p-4 text-center flex-1 max-w-[280px] cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowComparisonModal(true)}
          >
            <div className="flex items-center justify-center mb-2">
              <GitCompare className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="font-bold text-lg text-gray-800 mb-2">A/B Testing Mode</div>
            <div className="text-sm text-gray-600 leading-tight space-y-1">
              <div>• Compare variations</div>
              <div>• Side-by-side results</div>
              <div>• Performance differences</div>
              <div>• Clear winner selection</div>
            </div>
            {/* <div className="text-xs text-indigo-600 font-medium mt-2">
              Click to see how
            </div> */}
          </div>
        </div>

        {/* Combine Results */}
        <div className="flex items-center justify-center w-full max-w-4xl">
          <div className="flex-1 flex flex-col items-center">
            <ArrowRight className="w-6 h-6 text-emerald-600 -rotate-45" />
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded mt-1">
              Generate Report
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <ArrowRight className="w-6 h-6 text-emerald-600 rotate-45" />
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded mt-1">
              Save Results
            </span>
          </div>
        </div>

        {/* Final Results */}
        <div className="bg-emerald-50 border-2 border-emerald-600 rounded-lg p-4 text-center min-w-[350px]">
          <div className="flex items-center justify-center mb-2">
            <div className="flex gap-2">
              <Target className="w-8 h-8 text-emerald-600" />
              <Lightbulb className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="font-bold text-lg text-gray-800 mb-2">Complete Performance Report</div>
          <div className="text-sm text-gray-600 leading-tight space-y-1">
            <div>• Predicted views with confidence</div>
            <div>• Content score (0-100)</div>
            <div>• Detailed insights & recommendations</div>
            <div>• Performance category rating</div>
          </div>
        </div>

        {/* Arrow to Storage */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-gray-600" />
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded ml-2">
            Store & Track
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
              <div>• Store in your history</div>
              <div>• Track performance</div>
              <div>• Reference later</div>
            </div>
          </div>

          {/* Credit System */}
          <div className="bg-yellow-50 border-2 border-yellow-600 rounded-lg p-4 text-center flex-1 max-w-[250px]">
            <div className="flex items-center justify-center mb-2">
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="font-bold text-lg text-gray-800 mb-2">Credit Deduction</div>
            <div className="text-sm text-gray-600 leading-tight space-y-1">
              <div>• 1 credit per analysis</div>
              <div>• Track usage</div>
              <div>• Update balance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="mt-10 grid md:grid-cols-3 gap-6">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            ML-Powered Predictions
          </h3>
          <p className="text-sm text-gray-700">
            XGBoost model trained on real YouTube data predicts view counts with high accuracy.
          </p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Deep Content Analysis
          </h3>
          <p className="text-sm text-gray-700">
            Comprehensive scoring of title, description, and tags with actionable recommendations.
          </p>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h3 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            A/B Testing
          </h3>
          <p className="text-sm text-gray-700">
            Compare different content variations to choose the best performing version.
          </p>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-bold text-lg mb-3 text-gray-800 text-center">What You Get</h3>
        <div className="grid md:grid-cols-4 gap-4 text-sm text-center">
          <div>
            <div className="text-2xl font-bold text-purple-600">1</div>
            <div className="text-gray-600">Credit Per Analysis</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">0-100</div>
            <div className="text-gray-600">Content Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">5-10</div>
            <div className="text-gray-600">Recommendations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600">30s</div>
            <div className="text-gray-600">Analysis Time</div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-200">
        <h3 className="font-bold text-lg mb-3 text-green-800 text-center flex items-center justify-center gap-2">
          <Shield className="w-5 h-5" />
          System Reliability
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-center">
          <div>
            <div className="text-lg font-bold text-green-600">99.9%</div>
            <div className="text-gray-600">Uptime</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">30s</div>
            <div className="text-gray-600">Max Processing Time</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">Real-time</div>
            <div className="text-gray-600">Health Monitoring</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentEvaluationArchitecture;