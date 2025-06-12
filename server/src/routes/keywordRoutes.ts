import express from "express";
import {
  analyzeKeywordController,
  getPopularKeywordsController,
} from "../controller/keywordController";

const router = express.Router();

router.post("/analyze", analyzeKeywordController);
router.get("/popular", getPopularKeywordsController);

export default router;
