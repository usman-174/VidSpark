import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import axios from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import loginImage from "@/assets/login-image.png"; // Ensure this image exists in your assets

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: email || "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await axios.post("/auth/login", values);
      const role = response.data.user.role;
      console.log("User Role:", role);
      
      // ✅ Check if user is verified (improved logic)
      if (!response.data.user.isVerified && role !== "ADMIN") {
        toast.error("Please verify your email first. Check your inbox for verification code.");
        // Don't call login() if user is not verified
        // Pass email as URL parameter to ensure it persists
        navigate(`/verify-email?email=${encodeURIComponent(values.email)}`, { 
          replace: true, // Use replace to avoid back button issues
          state: { email: values.email } 
        });
        return;
      }

      // ✅ Successful login logic - only if user is verified
      login(response.data.token, response.data.user);
      toast.success("Login successful!");

      if (response.data.user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

    } catch (error: any) {
      console.error("Login error:", error);
      
      // ✅ Handle case where backend says 'not verified'
      if (error.response?.data?.error?.includes("not verified")) {
        toast.error("Please verify your email first. Check your inbox for verification code.");
        // Don't call login() if user is not verified
        navigate(`/verify-email?email=${encodeURIComponent(values.email)}`, { 
          replace: true,
          state: { email: values.email } 
        });
        return;
      }

      // ✅ Handle other authentication errors
      if (error.response?.status === 400) {
        form.setError("password", {
          type: "manual",
          message: "Invalid email or password",
        });
        toast.error("Invalid email or password");
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      {/* Left Side - Heading */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Login Page</h1>
          <p className="text-lg">Welcome back! Please login to your account.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
            Welcome Back!
          </h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        {...field}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between text-sm text-gray-600">
                <p>
                  Don't have an account?{" "}
                  <Link to="/register" className="text-blue-600 hover:underline">
                    Register
                  </Link>
                </p>
                <Link to="/forgot-password" className="text-blue-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-300"
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;