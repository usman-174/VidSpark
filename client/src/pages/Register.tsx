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
import useAuthStore from "@/store/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as z from "zod";

// ✅ Validation Schema
const registerSchema = z
  .object({
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    gender: z.enum(["male", "female"], {
      required_error: "Gender is required",
    }),
    name: z.string().trim().min(3, "Name must be at least 3 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const hasFetchedInvitation = useRef(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const invitationId = searchParams.get("invitationId");

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      gender: "male",
    },
  });

  // ✅ Updated onSubmit with "verify-email" logic
  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      await axios.post("/auth/register", {
        email: values.email,
        password: values.password,
        invitationId: invitationId || undefined,
        gender: values.gender,
        name: values.name,
      });

      toast.success(
        "Registration successful! Please check your email for verification code."
      );
      navigate("/verify-email", { state: { email: values.email } });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Something went wrong";

      if (errorMessage.includes("already exists")) {
        form.setError("email", {
          type: "manual",
          message: "Email already in use",
        });
        return;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Invitation link validation
  useEffect(() => {
    const fetchInvitationData = async () => {
      if (invitationId && !hasFetchedInvitation.current) {
        hasFetchedInvitation.current = true;
        try {
          const response = await axios.get(
            `/invitations/get-invitations/${invitationId}`
          );
          if (response && response.data) {
            const res = response.data;
            if (res.isUsed) {
              toast.error("Invitation link has already been used!");
              navigate("/login");
              return;
            }
            form.setValue("email", res.inviteeEmail);
          } else {
            toast.error("Invalid invitation link!");
            setSearchParams({});
          }
        } catch (error: any) {
          console.error(error);
        }
      }
    };
    fetchInvitationData();
  }, [invitationId, navigate, form, setSearchParams]);

  // ✅ Redirect if authenticated
  useLayoutEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // ✅ UI
  return (
    <div className="flex min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      {/* Left Side - Heading */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Create an Account</h1>
          <p className="text-lg">
            Please fill in the details below to register.
          </p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-white">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
            Register
          </h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                name="name"
                control={form.control}
                disabled={!!invitationId && !!form.getValues("name")}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your Name"
                        {...field}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="email"
                control={form.control}
                disabled={!!invitationId && !!form.getValues("email")}
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
                name="gender"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Gender</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-6">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            value="male"
                            checked={field.value === "male"}
                            onChange={() => field.onChange("male")}
                            className="form-radio"
                          />
                          <span className="ml-2">Male</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            value="female"
                            checked={field.value === "female"}
                            onChange={() => field.onChange("female")}
                            className="form-radio"
                          />
                          <span className="ml-2">Female</span>
                        </label>
                      </div>
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

              <FormField
                name="confirmPassword"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
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
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-600 hover:underline">
                    Login
                  </Link>
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-300"
              >
                {loading ? "Registering..." : "Register"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Register;
