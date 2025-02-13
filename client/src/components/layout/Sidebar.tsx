import React from "react";
import { Link, useLocation } from "react-router-dom";
import useAuthStore from "@/store/authStore";
import {
  Home,
  User,
  Settings,
  Layout,
  Video,
  Users,
  BarChart,
  ChevronLeft,
  Package2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}

const SidebarLink = ({
  to,
  icon: Icon,
  label,
  isActive,
  isCollapsed,
}: SidebarLinkProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center px-4 py-2 rounded-lg transition-colors duration-200",
      "hover:bg-teal-600", // Darker hover effect
      isActive && "bg-teal-600 text-white", // Active link highlight
    )}
  >
    <Icon
      className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400")}
    />
    {!isCollapsed && (
      <span className={cn("ml-4", isActive ? "text-white" : "text-gray-300")}>
        {label}
      </span>
    )}
  </Link>
);

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const isAdmin = user?.role === "ADMIN";

  const userLinks = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/dashboard", icon: Layout, label: "Dashboard" },
    { to: "/profile", icon: User, label: "Profile" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const adminLinks = [
    { to: "/admin", icon: BarChart, label: "Dashboard" },
    { to: "/admin/videos", icon: Video, label: "Videos" },
    { to: "/admin/packages", icon: Package2, label: "Packages" },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <aside
      className={cn(
        "h-screen border-r bg-teal-700 text-white transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 border-b flex items-center px-4">
        <Link to="/" className="w-full text-center">
          {!isCollapsed ? (
            <span className="font-semibold text-2xl text-white">
              VidSpark
            </span>
          ) : (
            <span className="font-semibold text-2xl text-white">V</span>
          )}
        </Link>
      </div>

      <div className="p-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          className=" justify-end ml-auto"
          onClick={onToggle}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-white" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-white" />
          )}
        </Button>
      </div>

      <nav className="px-4 py-2">
        <div className="space-y-1">
          {links.map((link) => (
            <SidebarLink
              key={link.to}
              {...link}
              isActive={location.pathname === link.to}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </nav>

      <div className="absolute bottom-0 w-full p-4">
        <div className="flex items-center gap-3">
          <img
            src={user?.profileImage || "/default-avatar.jpg"}
            alt="Profile"
            className="w-8 h-8 rounded-full bg-gray-700"
          />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
