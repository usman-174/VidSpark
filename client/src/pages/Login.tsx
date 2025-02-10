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
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import loginImage from "@/assets/login-image.png"; // Ensure this image exists in your assets

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const router = useNavigate();
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuthStore();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const { data } = await axios.post("/auth/login", values);
      login(data.token, data.user);
      toast.success("Login successful!");

      if (data.user.role === "ADMIN") {
        router("/admin");
      } else {
        router("/");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Something went wrong";
      toast.error(errorMessage);
      if (error.response?.status === 401) {
        form.setError("password", {
          type: "manual",
          message: "Invalid email or password",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Image */}
      <div className="hidden md:flex w-1/2 bg-gray-100 items-center justify-center">
        <img src={loginImage} alt="Login" className="w-3/4 rounded-lg shadow-lg" />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Welcome Back!</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between text-sm">
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
              <Button type="submit" disabled={loading} className="w-full">
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
