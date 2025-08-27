import React, { useState } from "react";
import { 
  Database, 
  Brain, 
  Server, 
  Code, 
  Search,
  FileText,
  Zap,
  Youtube,
  ArrowRight,
  CheckCircle,
  Users,
  TrendingUp
} from "lucide-react";

const TitleGenerationArchitecture = () => {
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);

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

  const YouTubeAPIModal = () => (
    <Modal
      isOpen={showYouTubeModal}
      onClose={() => setShowYouTubeModal(false)}
      title="YouTube Data Integration"
    >
      <div className="space-y-6">
        <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
          <h3 className="font-bold text-lg mb-2 text-red-800">
            🎯 Why Use Real YouTube Data?
          </h3>
          <p className="text-sm text-gray-700">
            Instead of guessing what works, we analyze actual successful YouTube videos to understand what titles get the most views and engagement.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-bold text-blue-800 mb-2">📊 What We Analyze</h4>
            <ul className="text-sm space-y-1">
              <li>• Popular videos in Pakistan</li>
              <li>• Videos similar to your topic</li>
              <li>• View counts and engagement</li>
              <li>• Title patterns that work</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-bold text-green-800 mb-2">🔍 What We Learn</h4>
            <ul className="text-sm space-y-1">
              <li>• Popular keywords right now</li>
              <li>• Best title formats</li>
              <li>• Ideal title length</li>
              <li>• Trending topics</li>
            </ul>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-yellow-800">
            ⚡ How It Works
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">1</span>
              <span>Search for videos related to your topic</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">2</span>
              <span>Get trending videos in Pakistan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">3</span>
              <span>Analyze what makes them successful</span>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-purple-800">
            🚀 Smart Optimizations
          </h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Multiple API Keys:</strong> Ensures we never hit limits</li>
            <li>• <strong>Batch Processing:</strong> Gets data faster</li>
            <li>• <strong>Smart Caching:</strong> Remembers recent data</li>
            <li>• <strong>Quick Timeout:</strong> Won't wait too long (10 seconds max)</li>
          </ul>
        </div>
      </div>
    </Modal>
  );

  const AIProcessModal = () => (
    <Modal
      isOpen={showAIModal}
      onClose={() => setShowAIModal(false)}
      title="AI Title Generation System"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <h3 className="font-bold text-lg mb-2 text-blue-800">
            🧠 Smart AI Backup System
          </h3>
          <p className="text-sm text-gray-700">
            We use multiple AI services so your titles are always generated, even if one service is down.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h4 className="font-bold text-green-800 mb-2">🥇 First Choice: Local AI (Ollama)</h4>
            <div className="text-sm space-y-1">
              <div><strong>Why it's great:</strong> Super fast, private, and free</div>
              <div><strong>Model:</strong> Advanced language model (qwen3:4b)</div>
              <div><strong>Speed:</strong> Usually responds in 20-35 seconds (Depending on the Hardware)</div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-orange-600">
              <span className="text-sm font-medium">If local AI is unavailable...</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-bold text-blue-800 mb-2">🥈 Backup: Cloud AI (OpenRouter)</h4>
            <div className="text-sm space-y-1">
              <div><strong>Why it's reliable:</strong> Always available, high quality</div>
              <div><strong>Model:</strong> DeepSeek Chat (proven for content creation)</div>
              <div><strong>Speed:</strong> Usually responds in 15-30 seconds</div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-red-600">
              <span className="text-sm font-medium">If both AI services fail...</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <h4 className="font-bold text-purple-800 mb-2">🛡️ Emergency Backup: Smart Templates</h4>
            <div className="text-sm space-y-1">
              <div><strong>Always works:</strong> Pre-made high-quality titles</div>
              <div><strong>Still smart:</strong> Uses YouTube data we collected</div>
              <div><strong>Instant:</strong> No waiting time</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-yellow-800">
            ⚡ What Makes Our AI Special
          </h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>YouTube-Trained:</strong> Knows what gets views</li>
            <li>• <strong>Psychology-Based:</strong> Uses curiosity and urgency</li>
            <li>• <strong>Data-Driven:</strong> Includes trending keywords</li>
            <li>• <strong>Quality-Checked:</strong> Validates every response</li>
          </ul>
        </div>
      </div>
    </Modal>
  );

  const ProcessFlowModal = () => (
    <Modal
      isOpen={showProcessModal}
      onClose={() => setShowProcessModal(false)}
      title="How Title Generation Works"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-blue-800">
            🔄 Simple 6-Step Process
          </h3>
        </div>

        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "You Enter Your Topic",
              description: "Type what you want to create a YouTube video about",
              color: "bg-blue-50 border-blue-500",
              icon: <Code className="w-5 h-5 text-blue-600" />
            },
            {
              step: "2", 
              title: "We Check YouTube",
              description: "Look at successful videos similar to your topic to see what's working",
              color: "bg-red-50 border-red-500",
              icon: <Youtube className="w-5 h-5 text-red-600" />
            },
            {
              step: "3",
              title: "AI Creates Titles",
              description: "Our smart AI combines your topic with YouTube insights to create engaging titles",
              color: "bg-purple-50 border-purple-500",
              icon: <Brain className="w-5 h-5 text-purple-600" />
            },
            {
              step: "4",
              title: "Quality Check", 
              description: "We make sure all titles are good quality with proper keywords and descriptions",
              color: "bg-green-50 border-green-500",
              icon: <CheckCircle className="w-5 h-5 text-green-600" />
            },
            {
              step: "5",
              title: "Save to Database",
              description: "Store your titles so you can access them later and mark favorites",
              color: "bg-gray-50 border-gray-500",
              icon: <Database className="w-5 h-5 text-gray-600" />
            },
            {
              step: "6",
              title: "Get Your Results",
              description: "Receive 5 optimized titles with keywords and descriptions ready to use",
              color: "bg-emerald-50 border-emerald-500",
              icon: <Zap className="w-5 h-5 text-emerald-600" />
            }
          ].map((item, idx) => (
            <div key={idx} className={`${item.color} border-l-4 p-4 rounded-lg`}>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-current">
                  <span className="text-sm font-bold">{item.step}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.icon}
                    <h4 className="font-bold text-sm">{item.title}</h4>
                  </div>
                  <p className="text-sm text-gray-700">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-green-800">
            ✅ Why This Works So Well
          </h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Never Fails:</strong> Triple backup system means you always get titles</li>
            <li>• <strong>Fast:</strong> Usually takes 10-15 seconds total</li>
            <li>• <strong>Based on Real Data:</strong> Uses actual YouTube success patterns</li>
            <li>• <strong>High Quality:</strong> Each title is checked and optimized</li>
          </ul>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <YouTubeAPIModal />
      <AIProcessModal />
      <ProcessFlowModal />

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Smart YouTube Title Generator
        </h1>
        <p className="text-gray-600">
          AI + Real YouTube Data = Titles That Get Views
        </p>
      </div>

      {/* Main Flow Diagram */}
      <div className="flex flex-col items-center space-y-6">
        
        {/* User Input */}
        <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-4 text-center min-w-[200px]">
          <div className="flex items-center justify-center mb-2">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="font-bold text-lg text-gray-800">You Enter Keywords</div>
          <div className="text-sm text-gray-600">
            "Gaming setup 2025","best gaming chair","expensive" or any video idea
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-gray-600" />
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded ml-2">
            Send to Server
          </span>
        </div>

        {/* Processing Hub */}
        <div className="bg-green-50 border-2 border-green-600 rounded-lg p-4 text-center min-w-[200px]">
          <div className="flex items-center justify-center mb-2">
            <Server className="w-8 h-8 text-green-600" />
          </div>
          <div className="font-bold text-lg text-gray-800">Smart Processing</div>
          <div className="text-sm text-gray-600">
            Checks your account & starts the magic
          </div>
        </div>

        {/* Split to Two Processes */}
        <div className="flex items-center justify-center w-full max-w-4xl">
          <div className="flex-1 flex flex-col items-center">
            <ArrowRight className="w-6 h-6 text-red-600 rotate-45" />
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded mt-1">
              Analyze YouTube
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <ArrowRight className="w-6 h-6 text-purple-600 -rotate-45" />
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded mt-1">
              Prepare AI
            </span>
          </div>
        </div>

        {/* YouTube Analysis and AI Row */}
        <div className="flex items-start justify-center space-x-8 w-full max-w-4xl">
          
          {/* YouTube Analysis */}
          <div 
            className="bg-red-50 border-2 border-red-600 rounded-lg p-4 text-center flex-1 max-w-[280px] cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowYouTubeModal(true)}
          >
            <div className="flex items-center justify-center mb-2">
              <Youtube className="w-8 h-8 text-red-600" />
            </div>
            <div className="font-bold text-lg text-gray-800 mb-2">YouTube Research</div>
            <div className="text-sm text-gray-600 leading-tight space-y-1">
              <div>• Find trending videos</div>
              <div>• Study successful titles</div>
              <div>• Extract popular keywords</div>
              <div>• Learn winning patterns</div>
            </div>
            <div className="text-xs text-red-600 font-medium mt-2">
              Click to learn more
            </div>
          </div>

          {/* AI Processing */}
          <div 
            className="bg-purple-50 border-2 border-purple-600 rounded-lg p-4 text-center flex-1 max-w-[280px] cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowAIModal(true)}
          >
            <div className="flex items-center justify-center mb-2">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <div className="font-bold text-lg text-gray-800 mb-2">AI Title Creation</div>
            <div className="text-sm text-gray-600 leading-tight space-y-1">
              <div>• Local AI (fastest)</div>
              <div>• Cloud AI (backup)</div>
              <div>• Smart templates (emergency)</div>
              <div>• Always works!</div>
            </div>
            <div className="text-xs text-purple-600 font-medium mt-2">
              Click to see how
            </div>
          </div>
        </div>

        {/* Combine Results */}
        <div className="flex items-center justify-center w-full max-w-4xl">
          <div className="flex-1 flex flex-col items-center">
            <ArrowRight className="w-6 h-6 text-orange-600 -rotate-45" />
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded mt-1">
              Combine Data
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <ArrowRight className="w-6 h-6 text-orange-600 rotate-45" />
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded mt-1">
              Create Titles
            </span>
          </div>
        </div>

        {/* Title Generation */}
        <div 
          className="bg-orange-50 border-2 border-orange-600 rounded-lg p-4 text-center min-w-[300px] cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowProcessModal(true)}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="flex gap-2">
              <Zap className="w-8 h-8 text-orange-600" />
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="font-bold text-lg text-gray-800 mb-2">Smart Title Generator</div>
          <div className="text-sm text-gray-600 leading-tight space-y-1">
            <div>• Combines YouTube insights + AI creativity</div>
            <div>• Creates 5 optimized titles</div>
            <div>• Adds keywords for SEO</div>
            <div>• Includes engaging descriptions</div>
          </div>
          <div className="text-xs text-orange-600 font-medium mt-2">
            Click for full process
          </div>
        </div>

        {/* Final Results */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 text-gray-600" />
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded ml-2">
            Ready to Use!
          </span>
        </div>

        {/* Results Row */}
        <div className="flex items-center justify-center space-x-8 w-full max-w-4xl">
          
          {/* Save to Database */}
          <div className="bg-gray-50 border-2 border-gray-600 rounded-lg p-4 text-center flex-1 max-w-[250px]">
            <div className="flex items-center justify-center mb-2">
              <Database className="w-8 h-8 text-gray-600" />
            </div>
            <div className="font-bold text-lg text-gray-800 mb-2">Save for Later</div>
            <div className="text-sm text-gray-600 leading-tight space-y-1">
              <div>• Store in your account</div>
              <div>• Access anytime</div>
              <div>• Mark favorites</div>
            </div>
          </div>

          {/* Your Results */}
          <div className="bg-emerald-50 border-2 border-emerald-600 rounded-lg p-4 text-center flex-1 max-w-[250px]">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="font-bold text-lg text-gray-800 mb-2">Your Perfect Titles</div>
            <div className="text-sm text-gray-600 leading-tight space-y-1">
              <div>• 5 click-worthy titles</div>
              <div>• SEO keywords included</div>
              <div>• Ready-to-use descriptions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="mt-10 grid md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Uses Real Data
          </h3>
          <p className="text-sm text-gray-700">
            Analyzes actual successful YouTube videos to understand what titles get the most views.
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Never Fails
          </h3>
          <p className="text-sm text-gray-700">
            Triple backup system ensures you always get high-quality titles, even if services are down.
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Lightning Fast
          </h3>
          <p className="text-sm text-gray-700">
            Optimized system delivers results in 10-15 seconds with smart caching and parallel processing.
          </p>
        </div>
      </div>

      {/* Simple Stats */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-bold text-lg mb-3 text-gray-800 text-center">What You Get</h3>
        <div className="grid md:grid-cols-4 gap-4 text-sm text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">5</div>
            <div className="text-gray-600">Unique Titles</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">60-100</div>
            <div className="text-gray-600">Characters Each</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">5-7</div>
            <div className="text-gray-600">Keywords Per Title</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">99.9%</div>
            <div className="text-gray-600">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleGenerationArchitecture;