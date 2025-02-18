// src/routes/paymentRoutes.ts
import { Router } from "express";
import {
  createPaymentIntentController,
  stripeWebhookController,
} from "../controller/paymentController";
// import your auth middleware if needed

const paymentRoutes = Router();

// Create Payment Intent
paymentRoutes.post("/intent", createPaymentIntentController);

// Stripe Webhook (must be raw body)
paymentRoutes.post("/webhook", stripeWebhookController);

export default paymentRoutes;
