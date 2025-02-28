import express from "express";
import {
  getInvitationById,
  getMyInvitations,
  sendInvitation,
} from "../controller/inviteController";
import { restrictTo, setUser } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/send-invitation",setUser, restrictTo(["USER"]), sendInvitation);
router.get("/get-invitations",setUser, restrictTo(["USER"]), getMyInvitations);
router.get("/get-invitations/:invitationId", getInvitationById);
export default router;
