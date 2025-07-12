import React from 'react';

const ArchitectureDiagram = () => {
  const components = [
    {
      title: "React.js Frontend",
      details: ["User Interface", "Send HTTP Requests", "Display Results"],
      bgColor: "bg-blue-50",
      borderColor: "border-blue-600"
    },
    {
      title: "Node.js + Express Server",
      details: ["API Routes", "Business Logic", "Call ML Server", "Database Operations"],
      bgColor: "bg-green-50",
      borderColor: "border-green-600"
    },
    {
      title: "PostgreSQL Database",
      details: ["Data Storage", "CRUD Operations", "Connected to Node.js Only"],
      bgColor: "bg-orange-50",
      borderColor: "border-orange-600"
    }
  ];

  const mlFlowSteps = [
    { title: "1. Request", subtitle: "From Frontend" },
    { title: "2. Process", subtitle: "Node.js Server" },
    { title: "3. ML Call", subtitle: "Python Server", special: true },
    { title: "4. Response", subtitle: "Back to Node.js" },
    { title: "5. DB Update", subtitle: "If Required" },
    { title: "6. Final Response", subtitle: "To Frontend" }
  ];

  const legendItems = [
    { color: "bg-blue-50 border-blue-600", label: "Frontend Layer (React.js)" },
    { color: "bg-green-50 border-green-600", label: "Backend Layer (Node.js + Express)" },
    { color: "bg-pink-50 border-pink-600", label: "ML Server (Python)" },
    { color: "bg-orange-50 border-orange-600", label: "Database (PostgreSQL)" }
  ];

  const processSteps = [
    "User Interaction: User interacts with React frontend",
    "API Request: Frontend sends HTTP request to Node.js server",
    "Server Processing: Express server processes the request",
    "ML Processing: Node.js calls Python ML server (if ML required)",
    "ML Response: Python server returns processed data to Node.js",
    "Database Operation: Node.js performs database operations",
    "Response: Node.js sends final response back to React frontend",
    "UI Update: React updates the user interface"
  ];

  const Arrow = ({ label }:any) => (
    <div className="flex flex-col items-center my-2">
      <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-gray-800"></div>
      {label && (
        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded mt-1">
          {label}
        </div>
      )}
    </div>
  );

  const FlowArrow = () => (
    <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[10px] border-t-transparent border-b-transparent border-l-gray-800 mx-1"></div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-10">
        MERN Stack + ML Server Architecture
      </h1>
      
      <div className="flex flex-col items-center space-y-4">
        {/* Frontend */}
        <div className={`${components[0].bgColor} ${components[0].borderColor} border-2 rounded-lg p-3 text-center min-w-[140px] max-w-[160px]`}>
          <div className="font-bold text-sm mb-1 text-gray-800">{components[0].title}</div>
          <div className="text-xs text-gray-600 leading-tight">
            {components[0].details.map((detail, idx) => (
              <div key={idx}>• {detail}</div>
            ))}
          </div>
        </div>

        <Arrow label="HTTP Requests/Responses" />

        {/* Backend */}
        <div className={`${components[1].bgColor} ${components[1].borderColor} border-2 rounded-lg p-3 text-center min-w-[140px] max-w-[160px]`}>
          <div className="font-bold text-sm mb-1 text-gray-800">{components[1].title}</div>
          <div className="text-xs text-gray-600 leading-tight">
            {components[1].details.map((detail, idx) => (
              <div key={idx}>• {detail}</div>
            ))}
          </div>
        </div>

        {/* ML Processing Flow */}
        <div className="w-full max-w-4xl my-4 p-3 bg-gray-50 border border-gray-300 rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            {mlFlowSteps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className={`bg-white border border-gray-800 rounded px-2 py-2 text-center text-xs min-w-[60px] ${
                  step.special ? 'bg-pink-50 border-pink-600' : ''
                }`}>
                  <div className="font-bold">{step.title}</div>
                  <div>{step.subtitle}</div>
                </div>
                {idx < mlFlowSteps.length - 1 && <FlowArrow />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Arrow label="Database Queries" />

        {/* Database */}
        <div className={`${components[2].bgColor} ${components[2].borderColor} border-2 rounded-lg p-3 text-center min-w-[140px] max-w-[160px]`}>
          <div className="font-bold text-sm mb-1 text-gray-800">{components[2].title}</div>
          <div className="text-xs text-gray-600 leading-tight">
            {components[2].details.map((detail, idx) => (
              <div key={idx}>• {detail}</div>
            ))}
          </div>
        </div>

        {/* ML Server (Separate) */}
        <div className="mt-4 p-3 border-2 border-dashed border-pink-600 rounded-lg">
          <div className="bg-pink-50 border-2 border-pink-600 rounded-lg p-3 text-center min-w-[140px] max-w-[160px]">
            <div className="font-bold text-sm mb-1 text-gray-800">Python ML Server</div>
            <div className="text-xs text-gray-600 leading-tight">
              <div>• ML Models</div>
              <div>• Data Processing</div>
              <div>• No Direct DB Access</div>
              <div>• Called by Node.js Only</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 p-3 bg-gray-50 border border-gray-300 rounded-lg">
        <h3 className="font-bold text-sm mb-3 text-gray-800">Component Legend</h3>
        <div className="space-y-2">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center text-xs">
              <div className={`w-4 h-4 border ${item.color} rounded mr-2`}></div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Process Flow */}
      <div className="mt-8 p-3 bg-gray-50 border border-gray-300 rounded-lg">
        <h3 className="font-bold text-sm mb-3 text-gray-800">Data Flow Process</h3>
        <ol className="list-decimal pl-4 space-y-1">
          {processSteps.map((step, idx) => (
            <li key={idx} className="text-xs leading-tight">
              <span className="font-medium">{step.split(':')[0]}:</span>
              <span className="ml-1">{step.split(':')[1]}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default ArchitectureDiagram;