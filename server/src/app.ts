import cors from "cors";
import dotenv from "dotenv";
import express, { Express, NextFunction, Request, Response } from "express";
import morgan from "morgan";

// Local imports
import { initializeCronJobs } from "./cron";
import { restrictTo, setUser } from "./middleware/authMiddleware";
import adminRouter from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import {
  default as ideaRoutes,
  default as ideasRouter,
} from "./routes/ideaRoutes";
import invitationRoutes from "./routes/invitationRoutes";
import keywordRoutes from "./routes/keywordRoutes";
import packageRouter from "./routes/packageRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import policyRoutes from "./routes/policyRoutes";
import titleRoutes from "./routes/titleRoutes";
import uploadRoutes from "./routes/uploadRoute";
import userRouter from "./routes/userRoutes";
import ytRouter from "./routes/ytRoutes";
import evaluationRouter from "./routes/evaluationRoutes";
import userInsightsRouter from "./routes/userInsightsRoutes";
// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["PORT", "NODE_ENV", "OPENROUTER_API_KEY"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.ORIGIN || "http://localhost:3000",
    ],
    credentials: true,
  })
);

// ... (other code)

// Start cron jobs
// initializeCronJobs();
// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ message: "Server is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/videos", setUser, ytRouter);
app.use("/api/admin", setUser, restrictTo(["ADMIN"]), adminRouter);
app.use("/api/packages", setUser, restrictTo(["ADMIN", "USER"]), packageRouter);
app.use("/api/users", setUser, restrictTo(["ADMIN"]), userRouter);
app.use("/api/uploads", setUser, restrictTo(["USER"]), uploadRoutes);
app.use("/api/payments", setUser, restrictTo(["USER", "ADMIN"]), paymentRoutes);
app.use("/api/titles", setUser, restrictTo(["USER"]), titleRoutes);
app.use("/api/policies", setUser, restrictTo(["ADMIN"]), policyRoutes);
app.use("/api/keywords", setUser, restrictTo(["USER"]), keywordRoutes);
app.use("/api/ideas-today", setUser, restrictTo(["USER"]), ideaRoutes);
app.use("/api/ideas", setUser, restrictTo(["USER"]), ideasRouter);
app.use(
  "/api/user/insights",
  setUser,
  restrictTo(["USER", "ADMIN"]),
  userInsightsRouter
);

app.use(
  "/api/evaluation",
  setUser,
  restrictTo(["USER", "ADMIN"]),
  evaluationRouter
);

// Global error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`❌ Unhandled error: ${err.message}`, err.stack);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message || "An unexpected error occurred",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Server running on http://localhost:${PORT}`);
});
