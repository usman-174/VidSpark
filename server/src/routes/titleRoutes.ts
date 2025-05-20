import express from "express";
import {
  generateTitles,
  getFavoriteTitles,
  getTitleGenerationById,
  getUserTitleGenerations,
  toggleFavoriteTitle,
} from "../controller/titleController";

const titleRoutes = express.Router();

titleRoutes.post("/generate", generateTitles);
// Get all title generations for current user
titleRoutes.get("/generations", getUserTitleGenerations);

// Get a specific title generation by ID
titleRoutes.get("/generations/:id", getTitleGenerationById);

// Toggle favorite status for a title
titleRoutes.put("/:titleId/favorite", toggleFavoriteTitle);

// Get all favorite titles
titleRoutes.get("/favorites", getFavoriteTitles);

export default titleRoutes;
