import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Assets
import MenuIcon from "../images/menu.svg"; 
import CancelIcon from "../images/cancel.svg";

function useOutsideClick(ref, callback) {
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) callback();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, callback]);
}

const Header = () => {
  const { user, logout, artisanId, isArtisan, coins } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const profileRef = useRef(null);

  useOutsideClick(profileRef, () => setDropdownOpen(false));

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isAuthPage = ["/signin", "/signup"].includes(pathname);
  const isPurchasePage = pathname === "/purchase-coins";
  const hideExtras = isAuthPage || isPurchasePage;
  const hasValidArtisanId = artisanId && artisanId !== "null";

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const styles = useMemo(() => ({
    nav: scrolled 
      ? "bg-stone-900/95 border-stone-800 shadow-xl" 
      : "bg-transparent border-transparent",
    text: "text-stone-100 hover:text-amber-500 transition-colors text-sm font-medium",
    btnSecondary: "flex items-center px-4 py-2 border border-white/20 text-stone-100 text-sm font-medium hover:bg-white/10 transition",
    mobileLink: "block text-lg font-serif text-stone-100 hover:text-amber-500 py-4 border-b border-stone-800/50"
  }), [scrolled]);

  return (
    <>
      <nav className={`fixed top-0 w-full z-[60] border-b transition-all duration-300 ${styles.nav}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <Link to="/" className="group flex flex-col z-50">
              <span className="text-2xl font-serif font-medium tracking-tight text-white group-hover:text-amber-500 transition-colors">
                The Guild
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-amber-500/80 -mt-1">
                Master Craftsmen
              </span>
            </Link>

            <div className="flex items-center space-x-6">
              {/* Desktop Nav */}
              {!hideExtras && (
                <div className="hidden lg:flex items-center space-x-6">
                  <Link to="/gallery" className={styles.text}>Collections</Link>
                  <Link to="/workers" className={styles.text}>The Workshop</Link>
                </div>
              )}

              {/* User / Auth Section */}
              <div className="flex items-center space-x-3 md:space-x-4">
                {user ? (
                  <div className="relative flex items-center space-x-3 md:space-x-4" ref={profileRef}>
                    
                    {/* New Messages Button */}
                    {!hideExtras && (
                      <Link 
                        to="/conversations" 
                        className="hidden sm:flex items-center text-stone-300 hover:text-white transition-colors"
                        title="Messages"
                      >
                        <span className="text-sm font-medium">Messages</span>
                        {/* You can add a small dot notification here if you have message counts */}
                        <span className="ml-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                      </Link>
                    )}

                    {isArtisan && coins !== null && !isPurchasePage && (
                      <Link to="/purchase-coins" className="hidden md:flex items-center px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full border border-amber-500/30">
                        {coins} Credits
                      </Link>
                    )}

                    <button 
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="hidden sm:block px-4 py-2 border border-white/20 text-stone-100 text-sm font-medium hover:bg-white/10"
                    >
                      {user.username || "Account"}
                    </button>

                    {!hideExtras && (
                      <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                      >
                        <img src={isMenuOpen ? CancelIcon : MenuIcon} className="w-6 h-6 invert" alt="toggle menu" />
                      </button>
                    )}

                    {dropdownOpen && (
                      <div className="absolute right-0 top-full mt-3 w-56 bg-stone-900 border border-stone-800 rounded-sm shadow-2xl overflow-hidden z-50 py-2 hidden sm:block">
                        <Link to={hasValidArtisanId ? "/artisan-profile" : "/profile"} className="block px-4 py-3 text-sm text-stone-300 hover:bg-stone-800">
                          {hasValidArtisanId ? "My Workshop" : "Become an Artisan"}
                        </Link>
                        {/* Messages added to dropdown for mobile-friendly desktop layouts */}
                        <Link to="/conversations" className="block sm:hidden px-4 py-3 text-sm text-stone-300 hover:bg-stone-800">
                          Messages
                        </Link>
                        <button onClick={() => { logout(); navigate("/signin"); }} className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-950/30">
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  !isAuthPage && (
                    <div className="flex items-center space-x-4">
                      <Link to="/signin" className="text-sm font-medium text-stone-100 hover:text-amber-500">Login</Link>
                      <Link to="/signup" className="px-6 py-2 bg-amber-600 text-white text-sm font-medium hover:bg-amber-700">Join</Link>
                      {!hideExtras && (
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-white">
                          <img src={isMenuOpen ? CancelIcon : MenuIcon} className="w-6 h-6 invert" alt="toggle" />
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Mobile Menu Overlay --- */}
      <div 
        className={`fixed inset-0 z-[55] bg-stone-950 transition-transform duration-500 lg:hidden ${
          isMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex flex-col h-full pt-28 px-8 pb-10">
          {!hideExtras && (
            <div className="flex flex-col">
              <Link to="/gallery" className={styles.mobileLink}>Collections</Link>
              <Link to="/workers" className={styles.mobileLink}>The Workshop</Link>
              {/* Messages explicitly in mobile menu */}
              {user && <Link to="/conversations" className={styles.mobileLink}>Messages</Link>}
              <Link to={hasValidArtisanId ? "/artisan-profile" : "/profile"} className={styles.mobileLink}>
                {hasValidArtisanId ? "My Workshop" : "Become an Artisan"}
              </Link>
            </div>
          )}

          <div className="mt-auto space-y-4">
            {user ? (
              <button 
                onClick={() => { logout(); navigate("/signin"); }}
                className="w-full py-4 text-center text-red-400 bg-red-950/20 border border-red-900/50 rounded-sm"
              >
                Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Link to="/signin" className="py-4 text-center text-white border border-white/10">Login</Link>
                <Link to="/signup" className="py-4 text-center bg-amber-600 text-white">Join the Guild</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;