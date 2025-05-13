import axios from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import * as z from "zod";

// ✅ Schema for verification code
const verificationSchema = z.object({
  verificationCode: z.string().min(6, "Verification code must be 6 characters"),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

const EmailVerification: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resentLoading, setResentLoading] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      verificationCode: "",
    },
  });

  // ✅ Get email from location state or query param
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const emailFromQuery = queryParams.get("email");
    const emailFromState = location.state?.email;

    if (emailFromQuery) {
      setEmail(emailFromQuery);
    } else if (emailFromState) {
      setEmail(emailFromState);
    } else {
      // Redirect if no email found
      navigate("/register");
    }
  }, [location, navigate]);

  // ✅ Submit handler for verification
  const onSubmit = async (values: VerificationFormValues) => {
    setLoading(true);
    try {
      await axios.post("/auth/verify-email", {
        email,
        verificationCode: values.verificationCode,
      });
      toast.success("Email verified successfully!");
      navigate("/login");
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Something went wrong";
      if (errorMessage.includes("invalid") || errorMessage.includes("expired")) {
        form.setError("verificationCode", {
          type: "manual",
          message: "Invalid or expired verification code",
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Resend code handler
  const handleResendCode = async () => {
    setResentLoading(true);
    try {
      await axios.post("/auth/resend-verification", { email });
      toast.success("Verification code resent successfully!");
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to resend code";
      toast.error(errorMessage);
    } finally {
      setResentLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Verify Your Email</h1>
        <p className="text-center text-gray-600 mb-6">
          Enter the 6-digit code sent to <strong>{email}</strong>
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* OTP Code Input */}
            <FormField
              name="verificationCode"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter 6-digit code"
                      {...field}
                      maxLength={6}
                      className="text-center text-xl tracking-widest px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Resend Link */}
            <div className="text-sm text-center text-gray-600">
              Didn't receive code?{" "}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resentLoading}
                className="text-blue-600 hover:underline disabled:opacity-50"
              >
                {resentLoading ? "Sending..." : "Resend"}
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded-md hover:bg-purple-700"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default EmailVerification;
