import React, { useState } from "react";
import { Database, Brain, Server, Code, Cpu } from "lucide-react";

const Architecture = () => {
  const [showPythonModal, setShowPythonModal] = useState(false);
  const [showNodeModal, setShowNodeModal] = useState(false);

  const components = [
    {
      title: "React.js Frontend",
      details: ["User Interface", "Send HTTP Requests", "Display Results"],
      bgColor: "bg-blue-50",
      borderColor: "border-blue-600",
      icon: Code,
      iconColor: "text-blue-600",
    },
    {
      title: "Node.js + Express Backend Server",
      details: [
        "API Routes",
        "Business Logic",
        "Call ML Server",
        "Database Operations",
      ],
      bgColor: "bg-green-50",
      borderColor: "border-green-600",
      icon: Server,
      iconColor: "text-green-600",
    },
    {
      title: "PostgreSQL Database",
      details: ["Data Storage", "CRUD Operations", "Connected to Node.js Only"],
      bgColor: "bg-orange-50",
      borderColor: "border-orange-600",
      icon: Database,
      iconColor: "text-orange-600",
    },
  ];

  // const mlFlowSteps = [
  //   { title: "1. Request", subtitle: "From Frontend" },
  //   { title: "2. Process", subtitle: "Node.js Server" },
  //   { title: "3. ML Call", subtitle: "Python Server", special: true },
  //   { title: "4. Response", subtitle: "Back to Node.js" },
  //   { title: "5. DB Update", subtitle: "If Required" },
  //   { title: "6. Final Response", subtitle: "To Frontend" },
  // ];

  const legendItems = [
    { color: "bg-blue-50 border-blue-600", label: "Frontend Layer (React.js)" },
    {
      color: "bg-green-50 border-green-600",
      label: "Backend Layer (Node.js + Express)",
    },
    { color: "bg-pink-50 border-pink-600", label: "ML Server (Python)" },
    { color: "bg-orange-50 border-orange-600", label: "Database (PostgreSQL)" },
  ];

  const processSteps = [
    "User Interaction: User interacts with React frontend",
    "API Request: Frontend sends HTTP request to Node.js server",
    "Server Processing: Express server processes the request",
    "ML Processing: Node.js calls Python ML server (if ML required)",
    "ML Response: Python server returns processed data to Node.js",
    "Database Operation: Node.js performs database operations",
    "Response: Node.js sends final response back to React frontend",
    "UI Update: React updates the user interface",
  ];

  const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

  const PythonServerModal = () => (
    <Modal
      isOpen={showPythonModal}
      onClose={() => setShowPythonModal(false)}
      title="Python ML Server Details"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-blue-800">
            🎯 Primary Purpose
          </h3>
          <p className="text-sm text-gray-700">
            FastAPI-based ML server that provides YouTube video analytics and
            sentiment analysis capabilities.
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-green-800">
            🤖 ML Models Used
          </h3>
          <div className="space-y-3">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-green-700">
                1. YouTube Views Predictor
              </h4>
              <p className="text-sm text-gray-600">
                <strong>Model:</strong> XGBoost Regression
                <br />
                <strong>Purpose:</strong> Predicts potential video views based
                on title, description, and tags
                <br />
                <strong>Input:</strong> Video metadata (title, description,
                tags)
                <br />
                <strong>Output:</strong> Predicted view count with confidence
                level
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-blue-700">
                2. Sentiment Analysis Model
              </h4>
              <p className="text-sm text-gray-600">
                <strong>Model:</strong> Twitter-RoBERTa-base-sentiment-latest
                <br />
                <strong>Purpose:</strong> Analyzes sentiment of text content
                <br />
                <strong>Input:</strong> Text content (single or batch)
                <br />
                <strong>Output:</strong> Sentiment (positive/negative/neutral)
                with confidence scores
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-purple-800">
            ⚡ API Endpoints
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">
                POST
              </span>
              <span className="font-mono">/predict</span>
              <span className="text-gray-600">- Predict video views</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                POST
              </span>
              <span className="font-mono">/sentiment</span>
              <span className="text-gray-600">
                - Single text sentiment analysis
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                POST
              </span>
              <span className="font-mono">/batch-sentiment</span>
              <span className="text-gray-600">- Batch sentiment analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">
                GET
              </span>
              <span className="font-mono">/health</span>
              <span className="text-gray-600">- Health check</span>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-orange-800">
            🔧 Tech Stack
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs">
              FastAPI
            </span>
            <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs">
              XGBoost
            </span>
            <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs">
              Transformers
            </span>
            <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs">
              PyTorch
            </span>
            <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs">
              scikit-learn
            </span>
            <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs">
              Uvicorn
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );

  const NodeServerModal = () => (
    <Modal
      isOpen={showNodeModal}
      onClose={() => setShowNodeModal(false)}
      title="Node.js Server Details"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-blue-800">
            🎯 Primary Purpose
          </h3>
          <p className="text-sm text-gray-700">
            Express.js server that handles API requests, manages business logic,
            and integrates with AI services for YouTube title generation.
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-green-800">
            🤖 AI Services Used
          </h3>
          <div className="space-y-3">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-green-700">
                1. Ollama Local AI Model
              </h4>
              <p className="text-sm text-gray-600">
                <strong>Model:</strong> qwen3:4b (Local deployment)
                <br />
                <strong>Purpose:</strong> Primary AI service for YouTube title
                generation
                <br />
                <strong>Endpoint:</strong> http://localhost:11434
                <br />
                <strong>Advantage:</strong> Fast, private, no API costs
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-blue-700">
                2. OpenRouter API (Fallback)
              </h4>
              <p className="text-sm text-gray-600">
                <strong>Model:</strong> deepseek/deepseek-chat-v3-0324:free
                <br />
                <strong>Purpose:</strong> Backup AI service when Ollama fails
                <br />
                <strong>Endpoint:</strong>{" "}
                https://openrouter.ai/api/v1/chat/completions
                <br />
                <strong>Advantage:</strong> Reliable cloud-based service
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-purple-800">
            ⚡ Smart Fallback System
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                1st
              </span>
              <span>Try Ollama (Local AI)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                2nd
              </span>
              <span>Fallback to OpenRouter (Cloud AI)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                3rd
              </span>
              <span>Enhanced fallback titles (Pre-generated)</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-yellow-800">
            🔧 Key Features
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                <strong>Intelligent Routing:</strong> Automatically switches
                between AI services
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                <strong>Usage Tracking:</strong> Logs feature usage for
                analytics
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                <strong>Error Handling:</strong> Graceful fallbacks ensure 99.9%
                uptime
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                <strong>Database Integration:</strong> Stores and retrieves data
                from PostgreSQL
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-gray-800">
            🔧 Tech Stack
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
              Express.js
            </span>
            <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
              TypeScript
            </span>
            <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
              Axios
            </span>
            <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
              PostgreSQL
            </span>
            <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
              Ollama
            </span>
            <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
              OpenRouter
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <PythonServerModal />
      <NodeServerModal />

      <h1 className="text-2xl font-bold text-center text-gray-800 mb-10">
        MERN Stack + ML Server Architecture
      </h1>

      <div className="flex flex-col items-center space-y-6">
        {/* Frontend */}
        <div
          className={`${components[0].bgColor} ${components[0].borderColor} border-2 rounded-lg p-4 text-center min-w-[180px] max-w-[200px]`}
        >
          <div className="flex items-center justify-center mb-2">
            <Code className={`w-8 h-8 ${components[0].iconColor}`} />
          </div>
          <div className="font-bold text-base mb-2 text-gray-800">
            {components[0].title}
          </div>
          <div className="text-xs text-gray-600 leading-tight">
            {components[0].details.map((detail, idx) => (
              <div key={idx}>• {detail}</div>
            ))}
          </div>
        </div>

        {/* Bidirectional Arrow between Frontend and Backend */}
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-blue-600"></div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
              HTTP Requests
            </span>
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-blue-600"></div>
          </div>
          <div className="h-8 w-px bg-blue-300"></div>
          <div className="flex items-center space-x-2">
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-green-600"></div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
              JSON Responses
            </span>
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-green-600"></div>
          </div>
        </div>

        {/* Backend Server */}
        <div
          className={`${components[1].bgColor} ${components[1].borderColor} border-2 rounded-lg p-4 text-center min-w-[180px] max-w-[200px] cursor-pointer hover:shadow-lg transition-shadow relative`}
          onClick={() => setShowNodeModal(true)}
        >
          <div className="flex items-center justify-center mb-2">
            <Server className={`w-8 h-8 ${components[1].iconColor}`} />
          </div>
          <div className="font-bold text-base mb-2 text-gray-800">
            {components[1].title}
          </div>
          <div className="text-xs text-gray-600 leading-tight mb-2">
            {components[1].details.map((detail, idx) => (
              <div key={idx}>• {detail}</div>
            ))}
          </div>
          <div className="text-xs text-blue-600 font-medium">
            Click for AI Services
          </div>
        </div>

        {/* Flow from Backend to both Database and ML Server */}
        <div className="flex items-center justify-center w-full max-w-3xl">
          {/* Left side - Database flow */}
          <div className="flex flex-col items-center flex-1">
            <div className="flex items-center space-x-2">
              <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-orange-600"></div>
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                SQL Queries
              </span>
            </div>
            <div className="h-8 w-px bg-orange-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-orange-600"></div>
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                Data Results
              </span>
            </div>
          </div>

          {/* Right side - ML Server flow */}
          <div className="flex flex-col items-center flex-1">
            <div className="flex items-center space-x-2">
              <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-pink-600"></div>
              <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded font-medium">
                ML Requests
              </span>
            </div>
            <div className="h-8 w-px bg-pink-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-pink-600"></div>
              <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded font-medium">
                AI Predictions
              </span>
            </div>
          </div>
        </div>

        {/* Bottom row with Database and ML Server */}
        <div className="flex items-center justify-center space-x-12 w-full max-w-3xl">
          {/* Database */}
          <div
            className={`${components[2].bgColor} ${components[2].borderColor} border-2 rounded-lg p-4 text-center min-w-[180px] max-w-[200px]`}
          >
            <div className="flex items-center justify-center mb-2">
              <Database className={`w-8 h-8 ${components[2].iconColor}`} />
            </div>
            <div className="font-bold text-base mb-2 text-gray-800">
              {components[2].title}
            </div>
            <div className="text-xs text-gray-600 leading-tight">
              {components[2].details.map((detail, idx) => (
                <div key={idx}>• {detail}</div>
              ))}
            </div>
          </div>

          {/* ML Server */}
          <div
            className="bg-pink-50 border-2 border-pink-600 rounded-lg p-4 text-center min-w-[180px] max-w-[200px] cursor-pointer hover:shadow-lg transition-shadow border-dashed"
            onClick={() => setShowPythonModal(true)}
          >
            <div className="flex items-center justify-center mb-2">
              <div className="flex gap-1">
                <Cpu className="w-6 h-6 text-pink-600" />
                <Brain className="w-6 h-6 text-pink-600" />
              </div>
            </div>
            <div className="font-bold text-base mb-2 text-gray-800">
              Python ML Server
            </div>
            <div className="text-xs text-gray-600 leading-tight mb-2">
              <div>• XGBoost Models</div>
              <div>• Sentiment Analysis</div>
              <div>• FastAPI Server</div>
              <div>• Independent Service</div>
            </div>
            <div className="text-xs text-pink-600 font-medium">
              Click for ML Details
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 p-3 bg-gray-50 border border-gray-300 rounded-lg">
        <h3 className="font-bold text-sm mb-3 text-gray-800">
          Component Legend
        </h3>
        <div className="space-y-2">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center text-sm">
              <div
                className={`w-4 h-4 border ${item.color} rounded mr-2`}
              ></div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Process Flow */}
      <div className="mt-8 p-3 bg-gray-50 border border-gray-300 rounded-lg">
        <h3 className="font-bold text-md mb-3 text-gray-800">
          Data Flow Process
        </h3>
        <ol className="list-decimal pl-4 space-y-1">
          {processSteps.map((step, idx) => (
            <li key={idx} className="text-d leading-tight">
              <span className="font-medium">{step.split(":")[0]}:</span>
              <span className="ml-1">{step.split(":")[1]}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default Architecture;
