import express from "express";
import {
  forgetPassword,
  getCurrentUser,
  loginUser,
  registerUser,
  resetPassword,
} from "../controller/authController";
import { setUser } from "../middleware/authMiddleware";

const router = express.Router();

// Register Route
router.post("/register", registerUser);

// Login Route
router.post("/login", loginUser);

// Get Me
router.get("/me", setUser, getCurrentUser);

// Reset Password Route
// prefix: /auth
router.post("/reset-password", resetPassword);

// forget Password Route
router.post("/forget-password", forgetPassword);

export default router;
