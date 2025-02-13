import React from "react";
import useAuthStore from "../store/authStore";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
  const { logout, isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16">
      {/* Main Content */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 space-y-6">
        {isAuthenticated ? (
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-800 mb-4">
              Welcome back, <span className="text-teal-600">{user?.email}</span>!
            </p>
            <button
              onClick={logout}
              className="mt-4 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-800 mb-4">
              You are not logged in.
            </p>
            <div className="flex justify-center space-x-6 mt-4">
              <Link
                to="/register"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
