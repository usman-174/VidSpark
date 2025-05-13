import { Request, Response } from "express";
import {
  register,
  login,
  resetPasswordService,
  forgetPasswordService,
  getUser,
  verifyEmailService,
  resendVerificationService,
} from "../services/authService";
import { Gender } from "@prisma/client";

// Register Controller
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password, invitationId, name, gender } = req.body;
  const processedGender = gender === "female" ? Gender.FEMALE : Gender.MALE;

  try {
    const user = await register(email, password, name, processedGender, invitationId);
    res.status(201).json({ message: "User registered successfully. Please verify your email.", user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Login Controller
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const { user, token } = await login(email, password);
    res.status(200).json({ message: "Login successful", token, user });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

// Reset Password Controller
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword } = req.body;
    await resetPasswordService(email, newPassword);
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Forget Password Controller
export const forgetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    await forgetPasswordService(email);
    res.status(200).json({ message: "Password reset email sent" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Get Current User Controller
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = res.locals;
    const currentUser = await getUser(user.userId);

    if (!currentUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(currentUser);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user details" });
  }
};

// Email OTP Verification Controller
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, verificationCode} = req.body;
    const result = await verifyEmailService(email, verificationCode);
    if (!result.success) {
      res.status(400).json({ error: result.message });
    } else {
      res.status(200).json({ message: result.message });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Resend Verification Email Controller
export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await resendVerificationService(email);
    if (!result.success) {
      res.status(400).json({ error: result.message });
    } else {
      res.status(200).json({ message: result.message });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};