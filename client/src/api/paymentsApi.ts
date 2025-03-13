import { User } from "@/store/authStore";
import axios from "./axiosInstance";

// Types for payment operations
export interface PaymentIntent {
  clientSecret: string;
  paymentId: string;
}

export interface CreatePaymentIntentRequest {
  packageId: string;
}

export interface ConfirmPaymentRequest {
  paymentId: string;
  stripePaymentId: string;
}

export interface Payment {
  id: string;
  userId: string;
  creditPackageId: string;
  amount: number;
  user: User;
  stripePaymentId: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  createdAt: string;
  creditPackage?: {
    name: string;
    credits: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
}

export interface PaymentStatistics {
  totalRevenue: number;
  totalAmount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  totalCount: number;
  successRate: number;
  failureRate: number;
  pendingRate: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  statistics?: PaymentStatistics;
}

// API functions for payments
export const paymentAPI = {
  // Create a payment intent with Stripe
  createPaymentIntent: (
    data: CreatePaymentIntentRequest
  ): Promise<PaymentIntent> =>
    axios.post("/payments/intent", data).then((res) => res.data),

  // Confirm a payment after successful Stripe payment
  confirmPayment: (data: ConfirmPaymentRequest): Promise<Payment> =>
    axios.post("/payments/confirm", data).then((res) => res.data),

  // Get current user's payment history with pagination
  getMyPayments: (
    params?: PaginationParams
  ): Promise<PaginatedResponse<Payment>> =>
    axios.get("/payments/my", { params }).then((res) => res.data),
    
  // Get all payments (admin only) with pagination and filters
  allPayments: (
    params?: PaginationParams
  ): Promise<PaginatedResponse<Payment>> =>
    axios.get("/payments/all", { params }).then((res) => res.data),
    
  // Get payment statistics separately if needed
  getPaymentStatistics: (
    params?: PaginationParams
  ): Promise<PaymentStatistics> =>
    axios.get("/payments/statistics", { params }).then((res) => res.data),
};

export default paymentAPI;