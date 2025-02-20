import express from "express";
import { getMyInvitations, sendInvitation } from "../controller/inviteController";


const router = express.Router();

router.post("/send-invitation", sendInvitation);
router.get("/get-invitations", getMyInvitations);

export default router;
