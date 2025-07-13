// keywordAnalysisRoutes.ts - YouTube Keyword Analysis Routes
import { Router } from "express";
import {
  analyzeKeywordController,
  keywordAnalysisHealthCheck,
  getKeywordAnalysisHistory,
  getTrendingKeywordsController,
  getKeywordAnalysisDetails,
} from "../controller/KeywordAnalysis";
import { setUser } from "../middleware/authMiddleware";

const keywordAnalysisRoutes = Router();

// Public routes (no authentication required)
keywordAnalysisRoutes.get("/health", keywordAnalysisHealthCheck);
keywordAnalysisRoutes.get("/trending", getTrendingKeywordsController);

// Protected routes (authentication required)
keywordAnalysisRoutes.post("/analyze", setUser, analyzeKeywordController);
keywordAnalysisRoutes.get("/history", setUser, getKeywordAnalysisHistory);
keywordAnalysisRoutes.get(
  "/details/:analysisId",
  setUser,
  getKeywordAnalysisDetails
);

export default keywordAnalysisRoutes;
