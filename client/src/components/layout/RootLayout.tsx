import useAuthStore from "@/store/authStore";
import { Outlet, Navigate } from "react-router-dom";
import { Navbar } from "./Navbar";

export const RootLayout = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};
