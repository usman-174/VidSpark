// src/controllers/paymentController.ts
import { Request, Response } from "express";
import { PaymentStatus } from "@prisma/client";
import { createPaymentIntent, confirmPaymentManually } from "../services/paymentService";
import { getUser } from "../services/authService";

/**
 * POST /payments/intent
 * Body: { creditPackageId: string }
 * Creates a PaymentIntent and returns the clientSecret along with a paymentId.
 */
export async function createPaymentIntentController(req: Request, res: Response): Promise<any> {
  try {
    // Assume auth middleware populates res.locals.user with { userId: string }
    let { user } = res.locals;
    const userId = user?.userId;
    const { creditPackageId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!creditPackageId) {
      return res.status(400).json({ error: "Missing creditPackageId" });
    }
    
    // Retrieve full user details
    user = await getUser(userId)as any;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const result = await createPaymentIntent(user, creditPackageId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /payments/confirm
 * Body: { paymentId: string }
 * Manually updates a Payment record to SUCCEEDED and increments the user's credits.
 */
export async function confirmPaymentController(req: Request, res: Response): Promise<any> {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: "Missing paymentId" });
    }
    
    const result = await confirmPaymentManually(paymentId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error confirming payment:", error);
    return res.status(500).json({ error: error.message });
  }
}
