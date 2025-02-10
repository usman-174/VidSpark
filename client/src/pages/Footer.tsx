import React from "react";

import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa6"
const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-300 py-8">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                    {/* Company Info */}
                    <div>
                        <h2 className="text-2xl font-bold text-white">VidSpark</h2>
                        <p className="mt-2 text-gray-400">Your go-to platform for high-quality video production and editing solutions.</p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-xl font-semibold text-white">Quick Links</h3>
                        <ul className="mt-2 space-y-2">
                            <li><a href="#" className="hover:text-blue-400 transition">Home</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition">About Us</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition">Services</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition">Contact</a></li>
                        </ul>
                    </div>

                    {/* Social Media */}
                    <div>
                        <h3 className="text-xl font-semibold text-white">Follow Us</h3>
                        <div className="mt-2 flex justify-center md:justify-start space-x-4">
                            <a href="#" className="text-gray-400 hover:text-blue-400 transition"><FaFacebookF size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-blue-400 transition"><FaTwitter size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-blue-400 transition"><FaLinkedinIn size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-blue-400 transition"><FaInstagram size={20} /></a>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-700 mt-6 pt-4 text-center text-gray-500">
                    <p>&copy; {new Date().getFullYear()} VidSpark. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
