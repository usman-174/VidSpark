import React from 'react';
import useAuthStore from '../store/authStore';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const { logout, isAuthenticated, user } = useAuthStore();
 
  
  return (
    <>
     

      {/* Main Content */}
      <div className="container mx-auto p-4">
        {isAuthenticated ? (
          <div className="text-center">
            <p className="text-xl text-foreground">Welcome back, {user?.email}!</p>
            <button
              onClick={logout}
              className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl text-foreground">You are not logged in.</p>
            <div className="flex justify-center space-x-4 mt-4">
              <Link
                to="/register"
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
