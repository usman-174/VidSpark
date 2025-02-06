import { Request, Response } from "express";
import { uploadImageAndSave } from "../services/uploadService";

export const uploadProfileImage = async (req: Request, res: Response):Promise<any> => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    console.log("Uploading file:", file.originalname); // Debugging log

    // Call service to upload image and update user profile
    const imageUrl = await uploadImageAndSave(user.userId, file.buffer);

    return res.status(200).json({ message: "Upload successful!", imageUrl });
  } catch (error) {
    console.error("Error during file upload:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
};
