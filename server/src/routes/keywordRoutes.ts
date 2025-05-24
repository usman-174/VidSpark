// src/routes/keywordRoutes.ts
import express from "express";
import { analyzeKeywordController } from "../controller/keywordController";

const router = express.Router();

router.post("/analyze", analyzeKeywordController);

export default router;
