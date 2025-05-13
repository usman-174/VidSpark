import express from "express";
import {
  forgetPassword,
  getCurrentUser,
  loginUser,
  registerUser,
  resetPassword,
  verifyEmail, // <-- New controller
  resendVerificationEmail, // <-- Optional controller
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
router.post("/reset-password", resetPassword);

// Forget Password Route
router.post("/forget-password", forgetPassword);

// Email Verification Route
router.post("/verify-email", verifyEmail); // <-- New route for OTP verification

// Optional: Resend Verification Email
router.post("/resend-verification", resendVerificationEmail); // <-- Optional route

export default router;
