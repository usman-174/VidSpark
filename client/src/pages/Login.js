import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, } from "@/components/ui/form";
import axios from "@/api/axiosInstance";
import { useState } from "react";
import useAuthStore from "@/store/authStore";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
const Login = () => {
    const router = useNavigate();
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated } = useAuthStore();
    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });
    const onSubmit = async (values) => {
        setLoading(true);
        try {
            const { data } = await axios.post("/auth/login", values);
            login(data.token, data.user);
            toast.success("Login successful!");
            console.log("data", data);
            if (data.user.role === "ADMIN") {
                router("/admin");
            }
            else {
                router("/");
            }
        }
        catch (error) {
            const errorMessage = error.response?.data?.error || "Something went wrong";
            toast.error(errorMessage);
            if (error.response?.status === 401) {
                form.setError("password", {
                    type: "manual",
                    message: "Invalid email or password",
                });
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-gray-100", children: _jsxs("div", { className: "w-full max-w-md bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Login" }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { name: "email", control: form.control, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter your email", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { name: "password", control: form.control, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Password" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: "Enter your password", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "text-sm ", children: [_jsxs("p", { children: ["Don't have an account?", " ", _jsx(Link, { to: "/register", className: "text-primary hover:underline", children: "Register" })] }), _jsx("p", { className: "text-right ", children: _jsx(Link, { to: "/forgot-password", className: "text-primary hover:underline", children: "Forgot Password?" }) })] }), _jsx(Button, { type: "submit", disabled: loading, className: "w-full", children: loading ? "Logging in..." : "Login" })] }) })] }) }));
};
export default Login;
