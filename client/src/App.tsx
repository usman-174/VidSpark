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
    } else {
      useAuthStore.setState({ isLoading: false });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />

      <Routes>
        {/* Public routes */}
        <Route element={<AuthRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Protected routes with layout */}
        <Route element={<RootLayout />}>
          {/* Common routes */}
          <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            {/* Profile */}
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin only routes */}
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/videos" element={<YTVideos />} />
            {/* Packages */}
            <Route path="/admin/packages" element={<PackagesPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
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
import PackagesPage from "./pages/Admin/Packages";
import UsersPage from "./pages/Admin/Users";

interface ProtectedRouteProps {
  allowedRoles: ("USER" | "ADMIN")[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={user?.role === "ADMIN" ? "/admin" : "/"} />;
  }

  return <Outlet />;
};

export const AuthRoute = () => {
  const { isAuthenticated, user } = useAuthStore();
  return isAuthenticated ? (
    <Navigate to={user?.role === "ADMIN" ? "/admin" : "/"} />
  ) : (
    <Outlet />
  );
};
