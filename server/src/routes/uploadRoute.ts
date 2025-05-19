import { Router } from "express";

import { uploadProfileImage } from "../controller/uploadController";
import { upload } from "../middleware/uploadMiddleware";

const uploadRoutes = Router();

uploadRoutes.post("/profile-image",  upload.single("file"), uploadProfileImage);

export default uploadRoutes;
