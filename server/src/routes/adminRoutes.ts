import express from "express";
import {
  getAdminStats,
  getInvitationStats,
  getCreditStats,
  getUserGrowthStats,
  getUserDomainStats,
  getFeatureUsageStats,
  getFeatureUsageByRange
} from "../controller/adminController";

const adminRouter = express.Router();

adminRouter.get("/stats", getAdminStats);
adminRouter.get("/invitations", getInvitationStats);
adminRouter.get("/credits", getCreditStats);
adminRouter.get("/user-growth", getUserGrowthStats);
adminRouter.get("/feature-usage", getFeatureUsageStats); // <-- All-time stats


adminRouter.get("/feature-usage-by-range", getFeatureUsageByRange); // <-- Filtered stats
adminRouter.get("/user-domains", getUserDomainStats);

export default adminRouter;
