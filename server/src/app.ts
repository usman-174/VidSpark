import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { restrictTo, setUser } from "./middleware/authMiddleware";
import adminRouter from "./routes/adminRoutes";
import packageRouter from "./routes/packageRoutes";
import userRouter from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import invitationRoutes from "./routes/invitationRoutes";
import uploadRoutes from "./routes/uploadRoute";
import ytRouter from "./routes/ytRoutes";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: ["*","http://localhost:5174","http://localhost:5173", process.env.ORIGIN!],
    credentials: true,
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// Authentication and invitation routes
app.use("/api/auth", authRoutes);
app.use("/api/invitations", setUser, restrictTo(["USER"]), invitationRoutes);

// Video scraping and admin routes
app.use("/api/videos", setUser, ytRouter);
app.use("/api/admin", setUser, restrictTo(["ADMIN"]), adminRouter);
app.use("/api/packages", setUser, restrictTo(["ADMIN"]), packageRouter);
app.use("/api/users", setUser, restrictTo(["ADMIN"]), userRouter);
app.use("/api/uploads", setUser, restrictTo(["USER"]), uploadRoutes);

// Start server
app.listen(PORT, () => {
  console.log("Environment:", process.env.NODE_ENV);
  
  console.log(` Server running on http://localhost:${PORT}\n`);
});
