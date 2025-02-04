import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "./store/authStore";
import Register from "@/pages/Register";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { Toaster } from "react-hot-toast";
function App() {
    const { isLoading } = useAuthStore();
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            useAuthStore.getState().getCurrentUser();
        }
        else {
            useAuthStore.setState({ isLoading: false });
        }
    }, []);
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin" }) }));
    }
    return (_jsxs(Router, { children: [_jsx(Toaster, { position: "top-right" }), _jsxs(Routes, { children: [_jsxs(Route, { element: _jsx(AuthRoute, {}), children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/forgot-password", element: _jsx(ForgotPassword, {}) }), _jsx(Route, { path: "/reset-password", element: _jsx(ResetPassword, {}) })] }), _jsxs(Route, { element: _jsx(RootLayout, {}), children: [_jsxs(Route, { element: _jsx(ProtectedRoute, { allowedRoles: ["USER"] }), children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(UserDashboard, {}) }), _jsx(Route, { path: "/profile", element: _jsx(Profile, {}) })] }), _jsxs(Route, { element: _jsx(ProtectedRoute, { allowedRoles: ["ADMIN"] }), children: [_jsx(Route, { path: "/admin", element: _jsx(AdminDashboard, {}) }), _jsx(Route, { path: "/admin/videos", element: _jsx(YTVideos, {}) })] })] })] })] }));
}
export default App;
// components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { RootLayout } from "./components/layout/RootLayout";
import { UserDashboard } from "./pages/UserDashboard";
import { AdminDashboard } from "./pages/Admin/AdminDashboard";
import { Loader2 } from "lucide-react";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import YTVideos from "./pages/Admin/YTVideos";
const ProtectedRoute = ({ allowedRoles }) => {
    const { user, isAuthenticated } = useAuthStore();
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login" });
    }
    if (!user || !allowedRoles.includes(user.role)) {
        return _jsx(Navigate, { to: user?.role === "ADMIN" ? "/admin" : "/" });
    }
    return _jsx(Outlet, {});
};
export const AuthRoute = () => {
    const { isAuthenticated, user } = useAuthStore();
    return isAuthenticated ? (_jsx(Navigate, { to: user?.role === "ADMIN" ? "/admin" : "/" })) : (_jsx(Outlet, {}));
};
