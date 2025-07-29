import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Globe from "../images/globe.svg";
import DropDown from "../images/dropdown.svg";
import Menu from "../images/menu.svg";
import Cancel from "../images/cancel.svg";
import Body from "./body";

function Header() {
  const [show, setShow] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [language, setLanguage] = useState("en");
  const { user, logout, artisanId, isArtisan, coins } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const langDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    setShowLangDropdown(false);
    if (lang === "ar") {
      document.body.classList.add("rtl");
      document.body.classList.remove("ltr");
      document.documentElement.lang = "ar";
      document.documentElement.dir = "rtl";
    } else {
      document.body.classList.add("ltr");
      document.body.classList.remove("rtl");
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const handleClick = () => {
    setShow((prevShow) => !prevShow);
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  const isHomePage = location.pathname === "/";
  const isLoginOrSignupPage = location.pathname === "/signin" || location.pathname === "/signup";
  const isPurchaseCoinsPage = location.pathname === "/purchase-coins";

  return (
    <div>
      <div className="header">
        <div className="header1">
          <Link to="/" className="buttons">Work Up</Link>
        </div>
        <div className="header2">
          {!isLoginOrSignupPage && !isPurchaseCoinsPage &&(
            <div onClick={handleClick} className={show ? "hamburger" : "hamburger-1"}>
              <img src={Menu} alt="Menu" className="hamburger-icon" />
            </div>
          )}
          {!isLoginOrSignupPage && !isPurchaseCoinsPage &&(
            <div onClick={handleClick} className={show ? "cancel-1" : "cancel"}>
              <img src={Cancel} alt="Cancel" className="cancel-icon" />
            </div>
          )}
          {!isLoginOrSignupPage && !isPurchaseCoinsPage &&(
            <div ref={langDropdownRef} className="dropdown-container" onClick={() => setShowLangDropdown(!showLangDropdown)}>
              <img src={Globe} style={{ width: "20px", height: "20px", marginRight: "5px" }} alt="Globe icon" />
              <button className="buttonss" aria-label="Select language" aria-expanded={showLangDropdown}>
                {language === "en" ? "EN" : "AR"}
              </button>
              <img src={DropDown} style={{ width: "20px", height: "20px", marginLeft: "-25px", marginRight: "0px", paddingRight: "0px" }} alt="Dropdown icon" />
            </div>
          )}
          {user ? (
            <div ref={dropdownRef} className="log">
              {isArtisan && coins !== null && !isPurchaseCoinsPage && (
                <Link
                  to="/purchase-coins"
                  onClick={() => scrollToSection("contact")}
                  className="buttonssss messagess"
                  style={{marginTop: "-9px" }}
                >
                  Coins: {coins}
                </Link>
              )}
              {user.role === "admin" && (
                <Link to="/admin" className="admin-btn buttonss" style={{ marginLeft: "10px" }}>
                  Admin Dashboard
                </Link>
              )}
              {user && !isPurchaseCoinsPage && <Link to="/conversations" className="buttonssss messagess">Messages</Link>}
              {!isPurchaseCoinsPage &&
              <button
                className="buttonssss"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
                aria-expanded={dropdownOpen}
              >
                < span className="text-scroll">{user.username || "Profile"}</span>
              </button>
}
              {dropdownOpen &&  (
                <div className="dropdown-menu dropdown-menu2">
                  {artisanId && artisanId !== "null" ? (
                    <Link
                      to="/artisan-profile"
                      className="dropdown-item buttonss"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Profile
                    </Link>
                  ) : (
                    <Link
                      to="/profile"
                      className="dropdown-item buttonss"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Become an Artisan
                    </Link>
                  )}
                  <div
                    className="dropdown-item buttonss"
                    onClick={handleLogout}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleLogout()}
                  >
                    Logout
                  </div>
                </div>
              )}
            </div>
          ) : (
            !isLoginOrSignupPage && (
              <div className="log">
                <Link className="buttonssss" to="/signin"><span className="text-scroll">Log in</span></Link>
                <Link className="buttonsss" to="/signup"><span className="text-scroll">Get Started</span></Link>
              </div>
            )
          )}
          {!isLoginOrSignupPage && showLangDropdown && (
            <div className="dropdown-menu">
              <div
                className="dropdown-item buttonss"
                onClick={() => changeLanguage("en")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && changeLanguage("en")}
              >
                EN
              </div>
              <div
                className="dropdown-item buttonss"
                onClick={() => changeLanguage("ar")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && changeLanguage("ar")}
              >
                AR
              </div>
            </div>
          )}
        </div>
      </div>
      <Body show={show} setShow={setShow} />
    </div>
  );
}

export default Header;