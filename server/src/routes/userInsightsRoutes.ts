// routes/userInsightsRoutes.ts
import express from "express";
import { UserInsightsController } from "../controller/userInsightsController";

const userInsightsRouter = express.Router();

// ================================
// 📊 USER INSIGHTS ENDPOINTS
// ================================

// Main dashboard insights for homepage
userInsightsRouter.get("/dashboard", UserInsightsController.getDashboardInsights);

// Content performance metrics
userInsightsRouter.get("/performance", UserInsightsController.getContentPerformance);

// Personalized recommendations
userInsightsRouter.get("/recommendations", UserInsightsController.getRecommendations);

// Activity summary with configurable time period
userInsightsRouter.get("/activity", UserInsightsController.getActivitySummary);

// Quick stats for navbar/header
userInsightsRouter.get("/quick-stats", UserInsightsController.getQuickStats);

export default userInsightsRouter;