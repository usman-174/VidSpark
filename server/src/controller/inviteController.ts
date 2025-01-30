// src/controller/inviteController.ts

import { Request, Response } from "express";
import { createInvitation } from "../services/inviteService";
import { getUserByEmail } from "../services/authService";

/**
 * Handles sending an invitation.
 * @param req Express Request object
 * @param res Express Response object
 */
export const sendInvitation = async (req: Request, res: Response): Promise<any> => {
    const { inviterId, inviteeEmail } = req.body;
    
    // return early if invalid
    if (!inviterId || !inviteeEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    try {
      const existingUser = await getUserByEmail(inviteeEmail);
      
      if (existingUser) {
        return res.status(400).json({ error: "User with provided email already exists" });
      }
     
      const invitation = await createInvitation(inviterId, inviteeEmail);
     

      return res.status(201).json(invitation);
    } catch (error) {
      console.error("Error creating invitation:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  