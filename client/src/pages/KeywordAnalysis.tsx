
import KeywordAnalysisDetailsModal from "@/components/keywordAnalysis/KeywordAnalysisDetailsModal";
import KeywordAnalysisMain from "@/components/keywordAnalysis/KeywordAnalysisMain";
import KeywordAnalysisSidebar from "@/components/keywordAnalysis/KeywordAnalysisSidebar";
import { useState } from "react";

const KeywordAnalysis = () => {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(
    null
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string>("");

  const handleViewDetails = (analysisId: string) => {
    setSelectedAnalysisId(analysisId);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedAnalysisId(null);
  };

  const handleKeywordSelect = (keyword: string) => {
    setSelectedKeyword(keyword);
    // Scroll to top to make the form visible
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleKeywordChange = (keyword: string) => {
    // Update selected keyword when user types or changes the input
    setSelectedKeyword(keyword);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Analyzer Card - Takes up 3 columns */}
          <div className="lg:col-span-3">
            <KeywordAnalysisMain
              onViewDetails={handleViewDetails}
              selectedKeyword={selectedKeyword}
              onKeywordChange={handleKeywordChange}
            />
          </div>

          {/* Sidebar - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <KeywordAnalysisSidebar onKeywordClick={handleKeywordSelect} />
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <KeywordAnalysisDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        analysisId={selectedAnalysisId}
      />
    </>
  );
};

export default KeywordAnalysis;
