"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { User } from "@/utils/types";

interface AuthContextType {
  accessToken: string | null;
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  accessToken: null,
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("/api/v1/auth/me", { withCredentials: true });
      if (res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("No se pudo obtener la sesión del usuario:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Helper para leer cookies
    const getCookie = (name: string): string | undefined => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
    };

    const isLoggedIn = getCookie("is_logged_in");

    if (isLoggedIn === "true") {
      fetchUser();
    } else {
      setIsLoading(false);
      setUser(null);
    }
  }, [fetchUser]);

  const login = (token: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axios.post("/api/v1/auth/logout");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setAccessToken(null);
      setUser(null);
      // Las cookies httpOnly se eliminan desde el backend
      router.push("/authentication/login");
    }
  };

  return (
    <AuthContext.Provider value={{ accessToken, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
}
