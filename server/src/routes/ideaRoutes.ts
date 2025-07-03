import express from "express";
import {
  generateIdeasOfTheDay,
  showIdeasOfTheDay,
} from "../controller/ideaController";

const ideaRoutes = express.Router();

ideaRoutes.post("/generate", generateIdeasOfTheDay);
ideaRoutes.get("/show", showIdeasOfTheDay);

export default ideaRoutes;