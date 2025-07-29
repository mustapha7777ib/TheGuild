import React, { useState, useRef } from "react";
import { TypeAnimation } from "react-type-animation";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Body({ show, setShow }) {
  console.log("Body - show value:", show, );
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, artisanId, isArtisan, coins } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isHomePage = location.pathname === "/";
  const isPurchaseCoinsPage = location.pathname === "/purchase-coins";

  const handleLinkClick = () => {
    setShow(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {isHomePage && (
        <div className="containerbody">
          <p className="text">
            New to your area? Looking for<br />
            <TypeAnimation
              sequence={["an electrician?", 1000, "a carpenter?", 1000, "a plumber?", 1000]}
              speed={50}
              repeat={Infinity}
              style={{ fontWeight: 900 }}
            /><br />
          </p>
        </div>
      )}
      {!show && !isPurchaseCoinsPage && (
        <div className="containerbody-1">
          {(!user) ? (
            <div className="log-1">
              <Link className="buttonssss-1" to="/signin" onClick={handleLinkClick}>
                <span className="text-scroll">Log in</span>
              </Link>
              <Link className="buttonsss-1" to="/signup" onClick={handleLinkClick}>
                <span className="text-scroll">Get Started</span>
              </Link>
            </div>
          ) : (
            <div ref={dropdownRef} className="log-1">
              {isArtisan && coins !== null && (
                <Link
                  to="/purchase-coins"
                  onClick={() => {
                    scrollToSection("contact");
                    handleLinkClick();
                  }}
                  className="buttonssss-1 messagess coinss"
                  style={{ marginTop: "-80px" }}
                >
                  <span className="text-scroll">Coins: {coins}</span>
                </Link>
              )}
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="admin-btn buttonss"
                  style={{ marginLeft: "10px" }}
                  onClick={handleLinkClick}
                >
                  Admin Dashboard
                </Link>
              )}
              <Link
                to="/conversations"
                className="buttonssss-1 messagess"
                onClick={handleLinkClick}
              >
                Messages
              </Link>
              <button
                className="buttonssss-1"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
                aria-expanded={dropdownOpen}
              >
                <span className="text-scroll">{user.username || "Profile"}</span>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu menu3">
                  {artisanId && artisanId !== "null" ? (
                    <Link
                      to="/artisan-profile"
                      className="dropdown-item buttonss"
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLinkClick();
                      }}
                    >
                      My Profile
                    </Link>
                  ) : (
                    <Link
                      to="/profile"
                      className="dropdown-item buttonss"
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLinkClick();
                      }}
                    >
                      Become an Artisan
                    </Link>
                  )}
                  <div
                    className="dropdown-item buttonss"
                    onClick={() => {
                      handleLogout();
                      handleLinkClick();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleLogout() && handleLinkClick()}
                  >
                    Logout
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default Body;