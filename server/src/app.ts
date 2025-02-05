import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import multer from "multer";
import cloudinary from "cloudinary";
import { PrismaClient } from "@prisma/client";
import invitationRoutes from "./routes/invitationRoutes";
import authRoutes from "./routes/authRoutes";
import { restrictTo, setUser } from "./middleware/authMiddleware";
import ytRouter from "./routes/ytRoutes";
import adminRouter from "./routes/adminRoutes";

dotenv.config();
console.log("Cloudinary Config:");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Not Loaded");


const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();


// Ensure Cloudinary is correctly configured
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check if Cloudinary config is loaded
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error(" Cloudinary configuration is missing. Check your .env file.");
  process.exit(1); // Exit the process if config is missing
}

// Multer setup for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Image Upload Route
app.post("/api/upload", setUser, upload.single("file"), async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    console.log("Uploading file:", file.originalname); // Debugging log

    // Upload to Cloudinary
    cloudinary.v2.uploader.upload_stream(
      { folder: "profile-images", resource_type: "image" }, // Ensure it's an image upload
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Cloudinary upload failed" });
        }

        if (!result?.secure_url) {
          return res.status(500).json({ error: "No image URL received from Cloudinary" });
        }

        console.log("Cloudinary Upload Successful:", result.secure_url); // Debugging log

        // Update user's profile image in the database
        await prisma.user.update({
          where: { id: user.userId },
          data: { profileImage: result.secure_url },
        });

        res.status(200).json({ message: "Upload successful!", imageUrl: result.secure_url });
      }
    ).end(file.buffer); // Send file buffer to Cloudinary
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: ["http://localhost:5173", process.env.ORIGIN!],
    credentials: true,
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// Authentication and invitation routes
app.use("/api/auth", authRoutes);
app.use("/api/invitations", setUser, restrictTo("USER"), invitationRoutes);

// Video scraping and admin routes
app.use("/api/videos", setUser, restrictTo("ADMIN"), ytRouter);
app.use("/api/admin", setUser, restrictTo("ADMIN"), adminRouter);

// Start server
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
