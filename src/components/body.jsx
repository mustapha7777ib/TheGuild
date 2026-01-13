import React, { useState, useRef } from "react";
import { TypeAnimation } from "react-type-animation";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../context/AuthContext.jsx';

function Body({ show, setShow }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, artisanId, isArtisan, coins } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const isHomePage = location.pathname === "/";
  const isPurchaseCoinsPage = location.pathname === "/purchase-coins";

  const handleLinkClick = () => {
    setShow(true); // Assuming 'true' means the mobile menu is closed/hidden
  };

  const handleLogout = () => {
    logout();
    handleLinkClick();
    navigate("/signin");
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Hero Section - Only on Home Page */}
      {isHomePage && (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center bg-gradient-to-b from-white to-gray-50">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            New to your area? <br className="hidden md:block" />
            <span className="text-gray-600 font-medium">Looking for </span>
            <span className="text-blue-600 block mt-2">
              <TypeAnimation
                sequence={["an electrician?", 1000, "a carpenter?", 1000, "a plumber?", 1000]}
                speed={50}
                repeat={Infinity}
              />
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-2xl">
            Connect with the best artisans in your neighborhood. Fast, reliable, and professional.
          </p>
        </div>
      )}

      {/* Mobile Menu Overlay - Shows when 'show' is false */}
      {!show && !isPurchaseCoinsPage && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop Blur */}
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={handleLinkClick}></div>
          
          <div className="fixed top-16 inset-x-0 bg-white shadow-2xl border-t border-gray-100 p-6 space-y-4 animate-in slide-in-from-top duration-300">
            {!user ? (
              <div className="flex flex-col space-y-3">
                <Link 
                  className="w-full py-3 px-4 text-center text-gray-700 font-semibold border border-gray-200 rounded-xl hover:bg-gray-50" 
                  to="/signin" 
                  onClick={handleLinkClick}
                >
                  Log in
                </Link>
                <Link 
                  className="w-full py-3 px-4 text-center text-white font-semibold bg-blue-600 rounded-xl shadow-lg hover:bg-blue-700" 
                  to="/signup" 
                  onClick={handleLinkClick}
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div ref={dropdownRef} className="flex flex-col space-y-2">
                {isArtisan && coins !== null && (
                  <Link
                    to="/purchase-coins"
                    onClick={() => {
                      scrollToSection("contact");
                      handleLinkClick();
                    }}
                    className="flex justify-between items-center w-full p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-100 font-bold"
                  >
                    <span>My Balance</span>
                    <span>{coins} Coins</span>
                  </Link>
                )}
                
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="p-4 text-gray-700 font-medium border-b border-gray-50 hover:bg-gray-50"
                    onClick={handleLinkClick}
                  >
                    Admin Dashboard
                  </Link>
                )}

                <Link
                  to="/conversations"
                  className="p-4 text-gray-700 font-medium border-b border-gray-50 hover:bg-gray-50"
                  onClick={handleLinkClick}
                >
                  Messages
                </Link>

                <button
                  className="flex justify-between items-center p-4 text-gray-700 font-medium border-b border-gray-50 hover:bg-gray-50"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span>{user.username || "Profile"}</span>
                  <span className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {dropdownOpen && (
                  <div className="bg-gray-50 rounded-lg mt-1 overflow-hidden transition-all">
                    {artisanId && artisanId !== "null" ? (
                      <Link
                        to="/artisan-profile"
                        className="block p-4 text-sm text-gray-600 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        My Profile
                      </Link>
                    ) : (
                      <Link
                        to="/profile"
                        className="block p-4 text-sm text-gray-600 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        Become an Artisan
                      </Link>
                    )}
                    <button
                      className="block w-full text-left p-4 text-sm text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Body;