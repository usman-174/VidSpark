import { Request, Response } from "express";
import * as userService from "../services/userService";

export const getUsersRoute = async (req: Request, res: Response) => {
  try {
    const users = await userService.getUsers();
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserByIdRoute = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // The gender field is not accepted for updates.
    const user = await userService.updateUser(id, req.body);
    res.status(200).json({ message: "User updated successfully", user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUserRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
