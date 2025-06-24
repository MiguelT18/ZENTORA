"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { decodeJwt, isTokenExpiringSoon, isTokenExpired } from "@/utils/jwt";
import axios from "axios";
import { useRouter } from "next/navigation";

interface AuthContextType {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  user: any;
}

const AuthContext = createContext<AuthContextType>({
  accessToken: null,
  setAccessToken: () => { },
  user: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode; }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      if (isTokenExpired(token)) {
        console.warn("Token expirado, eliminando...");
        localStorage.removeItem("token");
      } else {
        setAccessToken(token);
        setUser(decodeJwt(token));

        if (isTokenExpiringSoon(token)) {
          axios.post("/api/v1/auth/refresh", {
            withCredentials: true,
          }).then((res) => {
            setAccessToken(res.data.access_token);
            setUser(decodeJwt(res.data.access_token));
            localStorage.setItem("token", res.data.access_token);
          }).catch((err) => {
            console.error("Error al actualizar el token:", err);
            localStorage.removeItem("token");
            setAccessToken(null);
            setUser(null);
          });
        }
      }
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, user }}>
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
