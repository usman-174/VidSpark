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
  BarChart3,
  ChevronLeft,
  Package2,
  ChevronRight,
  Banknote,
  MessageSquare,
  Search,
  TrendingUp,
  Shield,
  CreditCard,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  badge?: string | number;
  description?: string;
}

const SidebarLink = ({
  to,
  icon: Icon,
  label,
  isActive,
  isCollapsed,
  badge,
  description,
}: SidebarLinkProps) => (
  <Link
    to={to}
    className={cn(
      "group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 relative",
      "hover:bg-teal-600/20 hover:text-white",
      isActive ? "bg-teal-600 text-white shadow-md" : "text-teal-100"
    )}
  >
    <Icon className={cn(
      "w-5 h-5 transition-colors",
      isActive ? "text-white" : "text-teal-200 group-hover:text-white"
    )} />
    
    {!isCollapsed && (
      <>
        <div className="ml-3 flex-1 min-w-0">
          <span className={cn(
            "font-medium text-sm",
            isActive ? "text-white" : "text-teal-100 group-hover:text-white"
          )}>
            {label}
          </span>
          {description && (
            <p className="text-xs text-teal-300 group-hover:text-teal-100 mt-0.5">
              {description}
            </p>
          )}
        </div>
        
        {badge && (
          <Badge 
            variant="secondary" 
            className={cn(
              "ml-2 text-xs",
              isActive 
                ? "bg-white/20 text-white" 
                : "bg-teal-600 text-white group-hover:bg-white/20"
            )}
          >
            {badge}
          </Badge>
        )}
      </>
    )}
    
    {isCollapsed && badge && (
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
    )}
  </Link>
);

interface SidebarSectionProps {
  title: string;
  isCollapsed: boolean;
  children: React.ReactNode;
}

const SidebarSection = ({ title, isCollapsed, children }: SidebarSectionProps) => (
  <div className="mb-6">
    {!isCollapsed && (
      <h3 className="px-3 mb-2 text-xs font-semibold text-teal-300 uppercase tracking-wider">
        {title}
      </h3>
    )}
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const isAdmin = user?.role === "ADMIN";
  
  const userMainLinks = [
    { 
      to: "/", 
      icon: Home, 
      label: "Dashboard", 
      description: "Overview & insights"
    },
    { 
      to: "/profile", 
      icon: User, 
      label: "Profile", 
      description: "Account settings"
    },
  ];

  const userFeatureLinks = [
    { 
      to: "/title-generation", 
      icon: Layout, 
      label: "Title Generation", 
      description: "AI-powered titles",
      badge: "Popular"
    },
    { 
      to: "/sentimental-analysis", 
      icon: MessageSquare, 
      label: "Sentiment Analysis", 
      description: "Analyze video mood"
    },
    { 
      to: "/keyword-analysis", 
      icon: Search, 
      label: "Keyword Analysis", 
      description: "Extract keywords",
      badge: "New"
    },
  ];

  const userAccountLinks = [
    { 
      to: "/payment-history", 
      icon: Banknote, 
      label: "Payment History", 
      description: "Transaction records"
    },
    { 
      to: "/packages", 
      icon: Package2, 
      label: "Credits & Plans", 
      description: "Manage subscription"
    },
  ];
  
  const adminLinks = [
    { 
      to: "/admin", 
      icon: BarChart3, 
      label: "Dashboard", 
      description: "Analytics overview"
    },
    { 
      to: "/admin/users", 
      icon: Users, 
      label: "Users", 
      description: "User management"
    },
    { 
      to: "/admin/videos", 
      icon: Video, 
      label: "Videos", 
      description: "Content management"
    },
    { 
      to: "/admin/packages", 
      icon: Package2, 
      label: "Packages", 
      description: "Subscription plans"
    },
    { 
      to: "/admin/payments", 
      icon: CreditCard, 
      label: "Payments", 
      description: "Transaction management"
    },
    { 
      to: "/admin/policies", 
      icon: Shield, 
      label: "Policies", 
      description: "System policies"
    },
  ];

  return (
    <aside
      className={cn(
        "h-screen border-r bg-gradient-to-b from-teal-800 to-teal-900 text-white transition-all duration-300 relative flex flex-col",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div className={cn(
        "h-16 border-b border-teal-700/50 flex items-center justify-between px-4",
        isCollapsed && "justify-center"
      )}>
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-teal-800" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-xl text-white">VidSpark</span>
          )}
        </Link>
        
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-teal-200 hover:text-white hover:bg-teal-700/50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Collapsed Toggle Button */}
      {isCollapsed && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full text-teal-200 hover:text-white hover:bg-teal-700/50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        {isAdmin ? (
          <SidebarSection title="Admin Panel" isCollapsed={isCollapsed}>
            {adminLinks.map((link) => (
              <SidebarLink
                key={link.to}
                {...link}
                isActive={location.pathname === link.to}
                isCollapsed={isCollapsed}
              />
            ))}
          </SidebarSection>
        ) : (
          <>
            <SidebarSection title="Main" isCollapsed={isCollapsed}>
              {userMainLinks.map((link) => (
                <SidebarLink
                  key={link.to}
                  {...link}
                  isActive={location.pathname === link.to}
                  isCollapsed={isCollapsed}
                />
              ))}
            </SidebarSection>

            <SidebarSection title="Features" isCollapsed={isCollapsed}>
              {userFeatureLinks.map((link) => (
                <SidebarLink
                  key={link.to}
                  {...link}
                  isActive={location.pathname === link.to}
                  isCollapsed={isCollapsed}
                />
              ))}
            </SidebarSection>

            <SidebarSection title="Account" isCollapsed={isCollapsed}>
              {userAccountLinks.map((link) => (
                <SidebarLink
                  key={link.to}
                  {...link}
                  isActive={location.pathname === link.to}
                  isCollapsed={isCollapsed}
                />
              ))}
            </SidebarSection>
          </>
        )}
      </nav>

      {/* Credits CTA for Users */}
      {!isAdmin && (
        <div className="px-4 pb-4">
          <Separator className="mb-4 bg-teal-700/50" />
          <Link
            to="/packages"
            className={cn(
              "flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg shadow-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-[1.02]",
              isCollapsed && "justify-center"
            )}
          >
            <Package2 className="w-5 h-5" />
            {!isCollapsed && (
              <div className="flex-1">
                <div className="text-sm font-bold">Upgrade Now</div>
                <div className="text-xs opacity-90">Get more credits</div>
              </div>
            )}
          </Link>
        </div>
      )}

      {/* User Profile */}
      <div className="border-t border-teal-700/50 p-4">
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}>
          <div className="relative">
            <img
              src={user?.profileImage || "/default-avatar.jpg"}
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-teal-600 bg-gray-100"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-teal-800 rounded-full"></div>
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || "User"}
              </p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-teal-300 truncate">
                  {user?.email}
                </p>
                {user?.role === "ADMIN" && (
                  <Badge variant="outline" className="text-xs bg-teal-700 text-teal-100 border-teal-600">
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;