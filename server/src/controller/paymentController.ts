// src/controllers/paymentController.ts
import { Request, Response } from "express";
import {
  createPaymentIntent,
  handlePaymentStatusUpdate,
} from "../services/paymentService";
import { PaymentStatus } from "@prisma/client";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-01-27.acacia",
});

/**
 * POST /payments/intent
 * Body: { creditPackageId: string }
 * Creates a PaymentIntent and returns the clientSecret.
 */
export async function createPaymentIntentController(
  req: Request,
  res: Response
) {
  try {
    const { user } = res.locals;
    const userId = user.userId;
    const { creditPackageId } = req.body;

    if (!creditPackageId) {
      res.status(400).json({ error: "Missing creditPackageId" });
    }

    const result = await createPaymentIntent(userId, creditPackageId);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /payments/webhook
 * Receives Stripe webhook events.
 * Make sure to parse the body as raw text and verify the Stripe signature.
 */
export async function stripeWebhookController(req: Request, res: Response) {
  let event: Stripe.Event;

  try {
    const signature = req.headers["stripe-signature"] as string;
    // Verify the event posted by Stripe
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody, // rawBody from your Express setup
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // Payment succeeded; update DB
      try {
        await handlePaymentStatusUpdate(
          paymentIntent.id,
          PaymentStatus.SUCCEEDED
        );
      } catch (error: any) {
        console.error("Error updating payment status to SUCCEEDED:", error);
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // Payment failed; update DB
      try {
        await handlePaymentStatusUpdate(paymentIntent.id, PaymentStatus.FAILED);
      } catch (error: any) {
        console.error("Error updating payment status to FAILED:", error);
      }
      break;
    }
    default:
      // Other events
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
}
