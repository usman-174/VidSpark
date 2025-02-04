import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, } from "@/components/ui/form";
import axios from "@/api/axiosInstance";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
const resetPasswordSchema = z
    .object({
    email: z.string().email("Invalid email address").optional(),
    token: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
export const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const urlToken = searchParams.get("token");
    const urlEmail = searchParams.get("email");
    const form = useForm({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            email: urlEmail || "",
            token: urlToken || "",
        },
    });
    const onSubmit = async (values) => {
        if (!values.email || !values.token) {
            toast.error("Email and reset code are required");
            return;
        }
        setLoading(true);
        try {
            await axios.post("/auth/reset-password", {
                email: values.email,
                newPassword: values.password,
                token: values.token,
            });
            toast.success("Password reset successful");
            navigate("/login");
        }
        catch (error) {
            toast.error(error.response?.data?.error || "Failed to reset password");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-gray-100", children: _jsxs("div", { className: "w-full max-w-md bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Reset Password" }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [!urlEmail && (_jsx(FormField, { name: "email", control: form.control, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter your email", ...field }) }), _jsx(FormMessage, {})] })) })), !urlToken && (_jsx(FormField, { name: "token", control: form.control, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Reset Code" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter reset code from email", ...field }) }), _jsx(FormMessage, {})] })) })), _jsx(FormField, { name: "password", control: form.control, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "New Password" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: "Enter new password", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { name: "confirmPassword", control: form.control, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Confirm Password" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: "Confirm new password", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(Button, { type: "submit", disabled: loading, className: "w-full", children: loading ? "Resetting..." : "Reset Password" }), _jsx(Button, { type: "button", variant: "secondary", onClick: () => navigate("/login"), className: "w-full", children: "Cancel" })] }) })] }) }));
};
