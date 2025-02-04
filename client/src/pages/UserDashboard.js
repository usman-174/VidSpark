import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/UserDashboard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useAuthStore from "@/store/authStore";
export const UserDashboard = () => {
    const { user } = useAuthStore();
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "User Dashboard" }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Profile Information" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: "Email:" }), " ", user?.email] }), _jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: "Role:" }), " ", user?.role] }), _jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: "Gender:" }), " ", user?.gender || 'Not specified'] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Account Status" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: "Status:" }), " Active"] }), _jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: "Member Since:" }), " ", new Date().toLocaleDateString()] })] }) })] })] })] }));
};
