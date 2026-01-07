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
    try {
      const response = await fetch("http://localhost:8080/auth/check-session", {
        credentials: "include",
      });

      if (!response.ok) {
        // If session is invalid, clear local states
        localStorage.removeItem("user");
        localStorage.removeItem("coins");
        setUser(null);
        setIsArtisan(false);
        setArtisanId(null);
        setCoins(null);
        return;
      }

      const rawUser = await response.json();
      
      // Normalize data: Map backend snake_case to frontend camelCase
      const formattedUser = {
        ...rawUser,
        artisanId: rawUser.artisanid || rawUser.artisanId,
        firstName: rawUser.first_name || rawUser.firstName,
        lastName: rawUser.last_name || rawUser.lastName,
      };

      setUser(formattedUser);
      localStorage.setItem("user", JSON.stringify(formattedUser));

      // Handle Artisan specific data if ID exists
      const targetArtisanId = formattedUser.artisanId;
      if (targetArtisanId && targetArtisanId !== "null") {
        const artResponse = await fetch(`http://localhost:8080/artisan/${targetArtisanId}`);
        if (artResponse.ok) {
          const artisanData = await artResponse.json();
          setIsArtisan(true);
          setArtisanId(artisanData.id);

          // Fetch Coins
          const coinsRes = await fetch(`http://localhost:8080/artisan/${artisanData.id}/coins`);
          if (coinsRes.ok) {
            const { coins: newCoins } = await coinsRes.json();
            setCoins(newCoins);
            localStorage.setItem("coins", newCoins.toString());
          }
        }
      } else {
        setIsArtisan(false);
        setArtisanId(null);
        setCoins(null);
      }
    } catch (err) {
      console.error("Auth sync error:", err);
      setError("Failed to sync session");
    } finally {
      setLoading(false);
    }
  }, []);

  // Run session check on every page load/refresh
  useEffect(() => {
    checkSessionAndFetchUser();
  }, [checkSessionAndFetchUser]);

  const login = useCallback(async (userData) => {
    if (!userData) return;

    // Normalize incoming login data immediately
    const formattedUser = {
      ...userData,
      artisanId: userData.artisanid || userData.artisanId,
    };

    setUser(formattedUser);
    localStorage.setItem("user", JSON.stringify(formattedUser));
    
    // Trigger a full sync to get coins and artisan details
    await checkSessionAndFetchUser();
  }, [checkSessionAndFetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("http://localhost:8080/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
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
    setCoins(newCoins);
    localStorage.setItem("coins", newCoins.toString());
  }, []);

  const setArtisanStatus = useCallback((status) => {
    setIsArtisan(!!status);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isArtisan,
        artisanId,
        setArtisanId,
        coins,
        updateCoins,
        setArtisanStatus,
        loading,
        error,
        refreshUser: checkSessionAndFetchUser // Expose refresh for use after profile updates
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