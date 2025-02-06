import { Router } from "express";

import { upload } from "../middleware/uploadMiddleware";
import { setUser } from "../middleware/authMiddleware";
import { uploadProfileImage } from "../controller/uploadController";

const uploadRoutes = Router();

uploadRoutes.post("/profile-image", setUser, upload.single("file"), uploadProfileImage);

export default uploadRoutes;
