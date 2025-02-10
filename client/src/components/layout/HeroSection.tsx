import useAuthStore from "@/store/authStore";
import React from "react";
import { useNavigate } from "react-router-dom";
// import logo from "../assets/logo.png";

// Hero Section
const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore()
  return (
    <section className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-24 px-6 flex flex-col items-center justify-center relative">
      {/* Navbar */}
      <div className="absolute top-6 left-6 flex items-center">
        {/* <img src={logo} alt="VidSpark Logo" className="h-12 w-auto" /> */}
        <h2 className="text-2xl font-bold ml-3">VidSpark</h2>
      </div>
      <div className="absolute top-6 right-6">

        {!user ? <>
          <button onClick={() => navigate('/login')} className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg shadow-md mr-4 hover:bg-gray-100 transition-all">Login</button>
          <button onClick={() => navigate('/register')} className="px-4 py-2 bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:bg-blue-800 transition-all">Register</button>
        </> :
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg shadow-md mr-4 hover:bg-gray-100 transition-all">Continue</button>

        }</div>
      {/* Hero Content */}
      <h1 className="text-6xl font-extrabold drop-shadow-lg">Welcome to VidSpark</h1>
      <p className="mt-4 text-xl max-w-2xl">Your go-to platform for high-quality video production and editing solutions.</p>
      <button onClick={() => navigate('/Register')} className="mt-6 px-8 py-3 bg-white text-blue-600 font-semibold rounded-full shadow-lg hover:bg-gray-100 transition-all">Get Started</button>
    </section>
  );
};

export default HeroSection;