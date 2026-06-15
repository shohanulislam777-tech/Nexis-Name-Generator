import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(
    localStorage.getItem("nexis_admin_token")
  );
  const [, setLocation] = useLocation();

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("nexis_admin_token", newToken);
    } else {
      localStorage.removeItem("nexis_admin_token");
    }
    setTokenState(newToken);
  };

  const logout = () => {
    setToken(null);
    setLocation("/login");
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setTokenState(localStorage.getItem("nexis_admin_token"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken, isAuthenticated: !!token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
