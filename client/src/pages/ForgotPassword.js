import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/ForgotPassword.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, } from "@/components/ui/form";
import axios from "@/api/axiosInstance";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});
export const ForgotPassword = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const form = useForm({
        resolver: zodResolver(forgotPasswordSchema),
    });
    const onSubmit = async (values) => {
        setLoading(true);
        try {
            await axios.post("/auth/forget-password", values);
            toast.success("Reset link sent to your email");
            navigate("/reset-password?email=" + values.email);
        }
        catch (error) {
            toast.error(error.response?.data?.error || "Failed to send reset link");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-gray-100", children: _jsxs("div", { className: "w-full max-w-md bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Forgot Password" }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { name: "email", control: form.control, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter your email", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "flex flex-col space-y-4", children: [_jsx(Button, { type: "submit", disabled: loading, children: loading ? "Sending..." : "Send Reset Link" }), _jsx(Link, { to: "/login", className: "text-sm text-center text-primary hover:underline", children: "Back to Login" })] })] }) })] }) }));
};
