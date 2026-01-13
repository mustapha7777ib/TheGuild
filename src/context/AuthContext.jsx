import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isArtisan, setIsArtisan] = useState(false);
  const [artisanId, setArtisanId] = useState(null);
  const [coins, setCoins] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const checkSessionAndFetchUser = useCallback(async () => {
    console.log("AUTH_DEBUG: Starting checkSessionAndFetchUser");
    try {
      const response = await fetch("/api/auth/check-session", {
        credentials: "include",
      });

      console.log("AUTH_DEBUG: Check-session response status:", response.status);

      if (!response.ok) {
        console.log("AUTH_DEBUG: Session invalid or missing. Clearing local state.");
        localStorage.removeItem("user");
        localStorage.removeItem("coins");
        setUser(null);
        setIsArtisan(false);
        setArtisanId(null);
        setCoins(null);
        return;
      }

      const rawUser = await response.json();
      console.log("AUTH_DEBUG: Raw user data from server:", rawUser);

      const formattedUser = {
        ...rawUser,
        id: rawUser.id || rawUser.userId,
        artisanId: rawUser.artisanid || rawUser.artisanId,
        firstName: rawUser.first_name || rawUser.firstName,
        lastName: rawUser.last_name || rawUser.lastName,
      };

      console.log("AUTH_DEBUG: Formatted user object:", formattedUser);

      setUser(formattedUser);
      localStorage.setItem("user", JSON.stringify(formattedUser));

      const targetArtisanId = formattedUser.artisanId;
      console.log("AUTH_DEBUG: Target Artisan ID detected:", targetArtisanId);

      if (targetArtisanId && targetArtisanId !== "null" && targetArtisanId !== undefined) {
        console.log("AUTH_DEBUG: Setting artisan status to true.");
        setIsArtisan(true);
        setArtisanId(targetArtisanId);

        console.log("AUTH_DEBUG: Fetching coins for artisan:", targetArtisanId);
        const coinsRes = await fetch(`/api/artisan/${targetArtisanId}/coins`);
        if (coinsRes.ok) {
          const { coins: newCoins } = await coinsRes.json();
          console.log("AUTH_DEBUG: Coins received:", newCoins);
          setCoins(newCoins);
          localStorage.setItem("coins", newCoins.toString());
        } else {
          console.log("AUTH_DEBUG: Failed to fetch coins. Status:", coinsRes.status);
        }
      } else {
        console.log("AUTH_DEBUG: No valid artisanId found. User is a regular customer.");
        setIsArtisan(false);
        setArtisanId(null);
        setCoins(null);
      }
    } catch (err) {
      console.error("AUTH_DEBUG_ERROR: Error in checkSessionAndFetchUser:", err);
      setError("Failed to sync session");
    } finally {
      console.log("AUTH_DEBUG: Auth loading finished.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("AUTH_DEBUG: AuthProvider mounted. Running initial session check.");
    checkSessionAndFetchUser();
  }, [checkSessionAndFetchUser]);

  const login = useCallback(
    async (userData) => {
      console.log("AUTH_DEBUG: Login function triggered with data:", userData);
      if (!userData) {
        console.log("AUTH_DEBUG: Login aborted, no userData provided.");
        return;
      }

      const formattedUser = {
        ...userData,
        id: userData.id || userData.userId,
        artisanId: userData.artisanid || userData.artisanId,
      };

      console.log("AUTH_DEBUG: Formatted login user:", formattedUser);
      setUser(formattedUser);
      localStorage.setItem("user", JSON.stringify(formattedUser));

      console.log("AUTH_DEBUG: Triggering session sync after login.");
      await checkSessionAndFetchUser();
    },
    [checkSessionAndFetchUser]
  );

  const logout = useCallback(async () => {
    console.log("AUTH_DEBUG: Logout triggered.");
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      console.log("AUTH_DEBUG: Logout API call status:", response.status);
    } catch (err) {
      console.error("AUTH_DEBUG_ERROR: Logout API error:", err);
    } finally {
      console.log("AUTH_DEBUG: Clearing local auth state and navigating to signin.");
      localStorage.removeItem("user");
      localStorage.removeItem("coins");
      setUser(null);
      setIsArtisan(false);
      setArtisanId(null);
      setCoins(null);
      navigate("/signin");
    }
  }, [navigate]);

  const updateCoins = useCallback((newCoins) => {
    console.log("AUTH_DEBUG: Updating coins state to:", newCoins);
    setCoins(newCoins);
    localStorage.setItem("coins", newCoins.toString());
  }, []);

  const setArtisanStatus = useCallback((status) => {
    console.log("AUTH_DEBUG: Manual setArtisanStatus called with:", status);
    setIsArtisan(!!status);
  }, []);

  const setArtisan = useCallback((id) => {
    console.log("AUTH_DEBUG: Manual setArtisan ID called with:", id);
    setArtisanId(id);
    setIsArtisan(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isArtisan,
        artisanId,
        setArtisan,
        setArtisanId,
        coins,
        updateCoins,
        setArtisanStatus,
        loading,
        error,
        refreshUser: checkSessionAndFetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};