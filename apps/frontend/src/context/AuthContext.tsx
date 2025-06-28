"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { User } from "@/utils/types";

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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

  const logout = useCallback(async () => {
    try {
      await axios.post("/api/v1/auth/logout");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setUser(null);
      // Las cookies httpOnly se eliminan desde el backend
      router.push("/authentication/login");
    }
  }, [router]);

  useEffect(() => {
    const refreshTokensPeriodically = () => {
      const interval = setInterval(async () => {
        const isLoggedIn = document.cookie.includes("is_logged_in=true");
        if (!isLoggedIn) return;

        try {
          const res = await axios.post("/api/v1/auth/refresh", null, {
            withCredentials: true,
          });

          if (res.data?.user) {
            setUser(res.data?.user);
            console.log("✅ Tokens refrescados automáticamente.");
          } else {
            console.warn("⚠️ No se pudo actualizar el usuario tras refrescar token.");
          }
        } catch (err) {
          console.error("❌ Error al refrescar tokens:", err);
          logout();
        }
      }, 5 * 60 * 1000); // cada 5 minutos

      return () => clearInterval(interval);
    };

    const stop = refreshTokensPeriodically();
    return stop;
  }, [logout]);

  const login = (userData: User) => setUser(userData);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
