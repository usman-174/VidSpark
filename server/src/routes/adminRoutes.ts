// src/routes/adminRoutes.ts
import express from "express";
import {
  getAdminStats,
  getInvitationStats,
  getCreditStats,
  getUserGrowthStats,
  getUserDomainStats,
  getFeatureUsageStats,
} from "../controller/adminController";

const adminRouter = express.Router();

adminRouter.get("/stats", getAdminStats);
adminRouter.get("/invitations", getInvitationStats);
adminRouter.get("/credits", getCreditStats);
adminRouter.get("/user-growth", getUserGrowthStats);
adminRouter.get("/feature-usage", getFeatureUsageStats);
adminRouter.get("/user-domains", getUserDomainStats);

export default adminRouter;
