import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import useAuthStore from "@/store/authStore";
import { Outlet, Navigate } from "react-router-dom";
import { Navbar } from "./Navbar";
export const RootLayout = () => {
    const { isAuthenticated } = useAuthStore();
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login" });
    }
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(Navbar, {}), _jsx("main", { className: "container mx-auto px-4 py-6", children: _jsx(Outlet, {}) })] }));
};
