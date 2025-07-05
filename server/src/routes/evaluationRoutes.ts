// routes/evaluationRoutes.ts
import express from "express";
import { EvaluationMetricController } from "../controller/evaluationMatricController";

const evaluationRouter = express.Router();

// ================================
// 📊 EVALUATION METRIC ROUTES
// ================================

// Health check endpoint - Check Python ML API status
evaluationRouter.get("/health", EvaluationMetricController.getHealth);

// Single video prediction - Predict views for one video
evaluationRouter.post("/predict", EvaluationMetricController.predictViews);

// Batch predictions - Predict views for multiple videos (max 50)
evaluationRouter.post(
  "/batch-predict",
  EvaluationMetricController.batchPredict
);

// Content analysis - Get detailed insights and recommendations
evaluationRouter.post("/analyze", EvaluationMetricController.analyzeContent);

export default evaluationRouter;
