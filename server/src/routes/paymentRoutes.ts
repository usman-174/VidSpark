// src/routes/paymentRoutes.ts
import { Router } from "express";
import {
  confirmPaymentController,
  createPaymentIntentController,
  getAllPaymentsController,
  getMyPaymentsController,
} from "../controller/paymentController";
// import your auth middleware if needed

const paymentRoutes = Router();

// Create Payment Intent
paymentRoutes.post("/intent", createPaymentIntentController);

// Confirm Payment manually (called from client)
paymentRoutes.post("/confirm", confirmPaymentController);

// Get My Payments (paginated)
paymentRoutes.get("/my", getMyPaymentsController);

// Get All Payments (paginated)
paymentRoutes.get("/all", getAllPaymentsController);
export default paymentRoutes;
