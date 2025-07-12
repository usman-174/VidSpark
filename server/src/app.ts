import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import xss from "xss-clean";
import hpp from "hpp";
import rateLimit from "express-rate-limit";

// Local imports
import { initializeCronJobs } from "./cron";
import { restrictTo, setUser } from "./middleware/authMiddleware";
import adminRouter from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import ideasRouter from "./routes/ideaRoutes";
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
requiredEnvVars.forEach((env) => {
  if (!process.env[env]) {
    console.error(`❌ Missing required environment variable: ${env}`);
    process.exit(1);
  }
});

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(xss());
app.use(hpp());

// JSON & Logging Middleware
app.use(express.json());
app.use(morgan("dev"));

// CORS
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.ORIGIN || "http://localhost:3000",
    "http://localhost:7000",
  ],
  credentials: true,
}));

// Rate Limiter (300 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ message: "Server is healthy" });
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
app.use("/api/ideas-today", setUser, restrictTo(["USER"]), ideasRouter);
app.use("/api/ideas", setUser, restrictTo(["USER"]), ideasRouter);
app.use("/api/user/insights", setUser, restrictTo(["USER", "ADMIN"]), userInsightsRouter);
app.use("/api/evaluation", setUser, restrictTo(["USER", "ADMIN"]), evaluationRouter);

// 404 Route
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`❌ Unhandled error: ${err.message}\n`, err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: err.message,
  });
});

// Start Cron Jobs
initializeCronJobs();

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
