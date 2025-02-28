// src/services/paymentService.ts
import { PrismaClient, PaymentStatus } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});
export const getPaymentsByUserIdPaginated = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  // Get payments with pagination
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: {
      creditPackage: true,
    },
  });

  // Get total count for pagination metadata
  const total = await prisma.payment.count({
    where: { userId },
  });

  return {
    payments,
    total,
  };
};

interface PaymentFilterOptions {
  page: number;
  limit: number;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  search?: string;
}

export const getAllPaymentsPaginated = async (
  options: PaymentFilterOptions
) => {
  const { page = 1, limit = 10, startDate, endDate, status, search } = options;
  const skip = (page - 1) * limit;

  // Build the where clause for filtering
  let whereClause: any = {};

  // Filter by date range
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt.gte = startDate;
    }
    if (endDate) {
      // Add 1 day to include the end date fully
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      whereClause.createdAt.lt = adjustedEndDate;
    }
  }

  // Filter by status
  if (status) {
    whereClause.status = status;
  }

  // Search by user email or transaction ID
  if (search) {
    whereClause.OR = [
      {
        stripePaymentId: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        user: {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  // Get payments with pagination and filters
  const payments = await prisma.payment.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: {
      creditPackage: true,
      user: {
        select: {
          id: true,
          email: true,
          creditBalance: true,
        },
      },
    },
  });

  // Get total count for pagination metadata with the same filters
  const total = await prisma.payment.count({
    where: whereClause,
  });

  return {
    payments,
    total,
  };
};
/**
 * Creates a Stripe PaymentIntent for the given credit package,
 * and stores a Payment record with status = PENDING.
 * @param user - The full user object
 * @param creditPackageId - The ID of the selected credit package
 * @returns { clientSecret, paymentId }
 */
export async function createPaymentIntent(user: any, creditPackageId: string) {
  // 1. Retrieve the credit package from the DB
  const creditPackage = await prisma.creditPackage.findUnique({
    where: { id: creditPackageId },
  });
  if (!creditPackage) {
    throw new Error("Credit package not found");
  }

  // 2. Create a Stripe PaymentIntent (amount is in cents)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(creditPackage.price * 100),
    currency: "usd",
    metadata: {
      userId: user.id,
      creditPackageId,
    },
  });

  // 3. Store the Payment record in the DB with status PENDING
  const newPayment = await prisma.payment.create({
    data: {
      userId: user.id,
      creditPackageId,
      amount: creditPackage.price,
      stripePaymentId: paymentIntent.id,
      status: PaymentStatus.PENDING,
    },
  });

  // 4. Return the clientSecret and internal paymentId
  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: newPayment.id,
  };
}

/**
 * Manually confirms a Payment by updating its status to SUCCEEDED.
 * Also increments the user's credit balance and logs a credit record.
 * @param paymentId - The internal Payment record ID
 * @returns The updated Payment record.
 */
export async function confirmPaymentManually(paymentId: string) {
  // 1. Find the Payment record by its internal ID and include the credit package details
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { creditPackage: true },
  });
  if (!payment) {
    throw new Error("Payment not found for the given payment ID");
  }
  if (payment.status !== PaymentStatus.PENDING) {
    // Payment has already been updated; return it directly
    return payment;
  }

  // 2. Update the Payment status in the DB to SUCCEEDED
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.SUCCEEDED },
    include: { creditPackage: true },
  });

  // 3. If the payment succeeded, increment the user's credits and log the credit record
  if (payment.creditPackage) {
    await prisma.$transaction(async (tx) => {
      // Update user's credit balance (assumes a creditBalance field exists on User)
      await tx.user.update({
        where: { id: payment.userId },
        data: {
          creditBalance: {
            increment: payment.creditPackage.credits,
          },
        },
      });

      // Create a Credit record for auditing (if you have a Credit model)
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

/* 


*/
