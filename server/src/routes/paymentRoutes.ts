// src/routes/paymentRoutes.ts
import { Router } from "express";
import {
  confirmPaymentController,
  createPaymentIntentController,
} from "../controller/paymentController";
// import your auth middleware if needed

const paymentRoutes = Router();

// Create Payment Intent
paymentRoutes.post("/intent", createPaymentIntentController);

// Confirm Payment manually (called from client)
paymentRoutes.post("/confirm", confirmPaymentController);

export default paymentRoutes;
