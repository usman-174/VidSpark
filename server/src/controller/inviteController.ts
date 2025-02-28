// src/controller/inviteController.ts

import { Request, Response } from "express";
import {
  createInvitation,
  getInvitationUsingId,
} from "../services/inviteService";
import {
  getInvitationsByUserId,
  getUserByEmail,
} from "../services/authService";

/**
 * Handles sending an invitation.
 * @param req Express Request object
 * @param res Express Response object
 */
export const sendInvitation = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { inviterId, inviteeEmail } = req.body;

  // return early if invalid
  if (!inviterId || !inviteeEmail) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existingUser = await getUserByEmail(inviteeEmail);

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with provided email already exists" });
    }

    const invitation = await createInvitation(inviterId, inviteeEmail);

    return res.status(201).json(invitation);
  } catch (error) {
    console.error("Error creating invitation:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyInvitations = async (
  req: Request,
  res: Response
): Promise<any> => {
  const user = res.locals.user;

  try {
    const invitations = await getInvitationsByUserId(user.userId);
    return res.status(200).json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getInvitationById = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { invitationId } = req.params;

  try {
    const invitation = await getInvitationUsingId(invitationId);
    return res.status(200).json(invitation);
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
