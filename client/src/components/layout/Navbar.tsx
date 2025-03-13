import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/store/authStore";
import { FC } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Role } from "@/store/authStore";
interface NavbarProps {
  user: User | null;
  logout: () => void;
}

export const Navbar: FC<NavbarProps> = ({ user, logout }) => {
  const isAdmin = user?.role === "ADMIN";
  console.log("user", user);

  return (
    <header className="h-16 border-b bg-white">
      <div className="flex items-center justify-between h-full px-6">
        <div className="w-1/3">{/* Empty for now */}</div>
        <div className="w-1/3 flex justify-end items-center gap-4">
          {!isAdmin && (
            <Badge variant="outline" className="h-8 px-3">
              Credits:{" "}
              <motion.span
                key={user?.creditBalance}
                initial={{ scale: 1.2, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="ml-1 inline-block"
              >
                {user?.creditBalance || 0}
              </motion.span>
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2">
              <img
                src={user?.profileImage || "/default-avatar.jpg"}
                alt="Profile"
                className="w-8 h-8 rounded-full border bg-gray-100"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled className="text-sm text-gray-600">
                {user?.email}
              </DropdownMenuItem>
              {user?.role === "USER" ? (
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={logout} className="text-red-600">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
