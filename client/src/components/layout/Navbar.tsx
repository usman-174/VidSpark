import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList
} from "@/components/ui/navigation-menu";
import useAuthStore from "@/store/authStore";
import { ChevronDown } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "../ui/badge";

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();


  return (
    <header className="bg-white shadow">
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-2 focus:outline-none"
        >
        <div className="text-2xl font-bold text-gray-800">VidSpark</div>
        </Link>

        {/* Navigation Menu */}
        <NavigationMenu>
          <NavigationMenuList className="flex space-x-4">
            <NavigationMenuItem>
              <Link to="/" className="hover:text-blue-600">
                Home
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to="/about" className="hover:text-blue-600">
                About
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to="/contact"
                className="hover:text-blue-600"
              >
                Contact
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* User Actions */}
        <div className="flex space-x-2">
          {isAuthenticated ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-2 focus:outline-none">
                  <img
                    src={user?.profileImage || "/default-avatar.jpg"}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border"
                  />
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-white shadow-lg rounded-md p-1 w-auto"
                >
                  <DropdownMenuItem>
                    {/* Email */}
                    <div className="px-3 py-1 text-sm text-gray-600">
                      {user?.email}
                    </div>
                  </DropdownMenuItem>

                  <Link
                    to="/profile"
                    className="block px-3 py-1 text-gray-800 hover:bg-gray-100 rounded-md"
                  >
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem>
                    <button
                      onClick={logout}
                      className="w-full text-left  px-3 py-1 text-red-600 hover:bg-gray-100 rounded-md"
                    >
                      Logout
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Show credits using a nice component  */}
           
              <Badge
                color="red"
                variant="outline"
              > Credits:{" "} {" "+(user?.totalCredits||0)}</Badge>
            </>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" asChild>
                <a href="/login">Login</a>
              </Button>
              <Button variant="default" asChild>
                <a href="/register">Sign Up</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
