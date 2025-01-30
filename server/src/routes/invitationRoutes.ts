import express from "express";
import { sendInvitation } from "../controller/inviteController";


const router = express.Router();

router.post("/send-invitation", sendInvitation);

export default router;
