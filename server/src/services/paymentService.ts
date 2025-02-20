// src/services/paymentService.ts
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

import { PaymentStatus } from "@prisma/client"; // or however you import the enums

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});

/**
 * Creates a Stripe PaymentIntent for the selected credit package,
 * and stores a Payment record with status = PENDING.
 */
const prisma = new PrismaClient();
export async function createPaymentIntent(
  userId: string,
  creditPackageId: string
) {
  // 1. Retrieve the credit package from DB
  const creditPackage = await prisma.creditPackage.findUnique({
    where: { id: creditPackageId },
  });

  if (!creditPackage) {
    throw new Error("Credit package not found");
  }

  // 2. Create a Stripe PaymentIntent
  //    Stripe amount is in the smallest currency unit (e.g., cents for USD)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(creditPackage.price * 100),
    currency: "usd",
    metadata: {
      userId,
      creditPackageId,
    },
  });

  // 3. Store the Payment in your DB with status = PENDING
  const newPayment = await prisma.payment.create({
    data: {
      userId,
      creditPackageId,
      amount: creditPackage.price,
      stripePaymentId: paymentIntent.id,
      status: PaymentStatus.PENDING,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: newPayment.id,
  };
}

/**
 * Called when Stripe notifies you via webhook that the PaymentIntent has succeeded (or failed).
 * Updates Payment status, user creditBalance, and inserts a Credit record for auditing.
 */
export async function handlePaymentStatusUpdate(
  stripePaymentId: string,
  status: PaymentStatus
) {
  // 1. Find the payment by its Stripe ID
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentId },
    include: {
      user: true,
      creditPackage: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found for the given Stripe Payment ID");
  }

  // 2. If Payment has already been updated, skip
  if (payment.status !== PaymentStatus.PENDING) {
    return payment;
  }

  // 3. Update the Payment status in the DB
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status,
    },
    include: {
      creditPackage: true,
    },
  });

  // 4. If succeeded, increment user credits and add a Credit record
  if (status === PaymentStatus.SUCCEEDED && payment.creditPackage) {
    await prisma.$transaction(async (tx) => {
      // Update the user's credit balance
      await tx.user.update({
        where: { id: payment.userId },
        data: {
          creditBalance: {
            increment: payment.creditPackage.credits,
          },
        },
      });

      // Create a new Credit record for auditing
      await tx.credit.create({
        data: {
          userId: payment.userId,
          credits: payment.creditPackage.credits,
        },
      });
    });
  }

  return updatedPayment;
}
