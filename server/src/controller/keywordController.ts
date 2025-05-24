// src/controller/keywordController.ts
import { Request, Response } from "express";
import { analyzeKeyword } from "../services/keywordService";

interface KeywordRequest {
  keyword: string;
}

export const analyzeKeywordController = async (
  req: Request<{}, {}, KeywordRequest>,
  res: Response
) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({ error: "Valid keyword is required" });
    }

    if (keyword.length > 100) {
      return res.status(400).json({ error: "Keyword too long" });
    }

    const analysis = await analyzeKeyword(keyword.trim());
    res.json(analysis);
  } catch (err) {
    console.error("Keyword analysis error:", err);
    res.status(500).json({ 
      error: "Failed to analyze keyword",
      details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};