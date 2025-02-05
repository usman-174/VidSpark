import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import invitationRoutes from "./routes/invitationRoutes";
import authRoutes from "./routes/authRoutes";
import { restrictTo, setUser } from "./middleware/authMiddleware";
import ytRouter from "./routes/ytRoutes";
import adminRouter from "./routes/adminRoutes";
import packageRouter from "./routes/packageRoutes";
import userRouter from "./routes/userRoutes";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: ["http://localhost:5173", process.env.ORIGIN!],
    credentials: true,
  })
);

// Health check

app.get("/health", (_, res) => {
  res.status(200).json({ message: "Server is running" });
});

app.use("/api/auth", authRoutes);

// Register routes
app.use("/api/invitations", setUser, restrictTo("USER"), invitationRoutes);

// Scraper route
app.use("/api/videos", setUser, restrictTo("ADMIN"), ytRouter);
app.use("/api/admin", setUser, restrictTo("ADMIN"), adminRouter);
app.use("/api/packages", setUser, restrictTo("ADMIN"), packageRouter);
app.use("/api/users", setUser, restrictTo("ADMIN"), userRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
