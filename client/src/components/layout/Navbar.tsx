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

interface NavbarProps {
  user: User | null;
  logout: () => void;
}

export const Navbar: FC<NavbarProps> = ({ user, logout }) => {
  const isAdmin = user?.role === "ADMIN";
  
  return (
    <header className="h-16 border-b bg-white">
      <div className="h-full px-6 flex items-center justify-end">
        <div className="flex items-center gap-4">
         {!isAdmin? <Badge variant="outline" className="h-8 px-3">
            Credits: {user?.totalCredits || 0}
          </Badge>:null}
          
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
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
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
