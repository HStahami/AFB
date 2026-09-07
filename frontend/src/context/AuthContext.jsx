import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || localStorage.getItem("adminToken") || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const login = async (username, password) => {
    const data = await authApi.login(username, password);
    const accessToken = data.access_token;
    const userData = data.user;

    localStorage.setItem("token", accessToken);
    // Maintain backward compatibility for any existing code checking adminToken
    if (userData.role === "admin") {
      localStorage.setItem("adminToken", accessToken);
    }
    localStorage.setItem("user", JSON.stringify(userData));

    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      localStorage.setItem("user", JSON.stringify(currentUser));
      return currentUser;
    } catch (err) {
      console.warn("Failed to refresh user:", err);
      return null;
    }
  };

  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem("token") || localStorage.getItem("adminToken");
      if (!savedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const currentUser = await authApi.getMe();
        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
      } catch (err) {
        console.warn("Session verification failed or token expired:", err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();

    const handleExpired = () => logout();
    window.addEventListener("auth-expired", handleExpired);
    return () => window.removeEventListener("auth-expired", handleExpired);
  }, []);

  const value = {
    token,
    user,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === "admin",
    isInstructor: user?.role === "instructor",
    isStudent: user?.role === "student",
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
