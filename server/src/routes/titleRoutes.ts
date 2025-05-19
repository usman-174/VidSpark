import express from "express";
import { generateTitles } from "../controller/titleController";

const titleRoutes = express.Router();

titleRoutes.post("/generate", generateTitles);

export default titleRoutes;
