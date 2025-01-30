import { Request, Response } from "express";
import {
  register,
  login,
  resetPasswordService,
  forgetPasswordService,
  getUser,
} from "../services/authService";

export const registerUser = async (req: Request, res: Response) => {
  // Now we grab inviterId if it’s included in the request body
  const { email, password, invitationId } = req.body;

  try {
    // Pass invitationId to the register service
    const user = await register(email, password, invitationId);

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const { user, token } = await login(email, password);
    res.status(200).json({ message: "Login successful", token, user });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    await resetPasswordService(email, newPassword);
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
export const forgetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await forgetPasswordService(email);
    res.status(200).json({ message: "Password reset email sent" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const { user } = res.locals;

    const currentUser = await getUser(user.userId);

    if (!currentUser) {
      res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(currentUser);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user details" });
  }
};
