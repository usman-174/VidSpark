// routes/adminRoutes.ts
import express from "express";
import {
  getAdminStats,
  getInvitationStats,
  getCreditStats,
  getUserGrowthStats,
  getUserDomainStats,
  getFeatureUsageStats,
  getFeatureUsageByRange,
  // New enhanced endpoints
  getComprehensiveInsights,
  getUserEngagementInsights,
} from "../controller/adminController";

const adminRouter = express.Router();

// ================================
// 📊 EXISTING ENDPOINTS (UNCHANGED)
// ================================

// General admin statistics
adminRouter.get("/stats", getAdminStats);

// Invitation system statistics
adminRouter.get("/invitations", getInvitationStats);

// Credit system statistics
adminRouter.get("/credits", getCreditStats);

// User growth analytics
adminRouter.get("/user-growth", getUserGrowthStats);

// User domain distribution
adminRouter.get("/user-domains", getUserDomainStats);

// ================================
// 📊 ENHANCED FEATURE USAGE ENDPOINTS
// ================================

// Feature usage statistics (enhanced but backward compatible)
// Query params: ?period=30d&detailed=false
adminRouter.get("/feature-usage", getFeatureUsageStats);

// Feature usage by time range (enhanced but backward compatible)
// Query params: ?range=7d
adminRouter.get("/feature-usage-by-range", getFeatureUsageByRange);

// ================================
// 📊 NEW COMPREHENSIVE INSIGHTS ENDPOINTS
// ================================

// Complete dashboard insights (new)
// Query params: ?days=30
adminRouter.get("/insights/comprehensive", getComprehensiveInsights);

// User engagement detailed insights (new)
adminRouter.get("/insights/user-engagement", getUserEngagementInsights);

export default adminRouter;
