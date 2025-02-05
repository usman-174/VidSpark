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
      "flex items-center px-3 py-2 rounded-lg transition-colors",
      "hover:bg-gray-100",
      isActive && "bg-gray-100 text-primary"
    )}
  >
    <Icon
      className={cn("w-5 h-5", isActive ? "text-primary" : "text-gray-600")}
    />
    {!isCollapsed && (
      <span className={cn("ml-3", isActive ? "text-primary" : "text-gray-600")}>
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
        "h-screen border-r bg-white transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 border-b flex items-center ">
        <Link to="/" className="text-center w-full">
          {!isCollapsed ? (
            <span className="font-semibold text-2xl text-center ">
              VidSpark
            </span>
          ) : (
            <span className="font-semibold text-2xl text-center ">V</span>
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
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
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

      <div className="absolute bottom-0 w-full p-4 ">
        <div className="flex items-center gap-3">
          <img
            src={user?.profileImage || "/default-avatar.jpg"}
            alt="Profile"
            className="w-8 h-8 rounded-full  bg-gray-100"
          />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
