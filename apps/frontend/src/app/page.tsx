"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useNotification } from "@/context/NotificationContext";
import axios, { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { addNotification } = useNotification();
  const { setAccessToken } = useAuth();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tempCode = searchParams.get("temp_code");

    if (tempCode) {
      const exchangeTempCode = async () => {
        try {
          const res = await axios.post("/api/v1/auth/exchange-temp-code", {
            temp_code: tempCode,
          });
          addNotification("success", res.data.message);
          localStorage.setItem("token", res.data.access_token);
          setAccessToken(res.data.access_token);
        } catch (e) {
          const error = e as AxiosError<{ detail: string }>;

          addNotification(
            "error",
            error.response?.data.detail || "Ha ocurrido un error al iniciar sesión"
          );
        }
      };
      exchangeTempCode();
    }
  }, [addNotification, setAccessToken]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-4xl uppercase font-bold">Sistema de Autenticación</h1>
      <p className="text-md text-light-text-secondary dark:text-dark-text-secondary">
        Bienvenido a nuestro sistema de login y registro
      </p>

      <div className="flex gap-4 items-center mt-4">
        <Link
          href="/authentication/login"
          className="text-white bg-primary hover:bg-primary/80 transition-colors p-2 rounded-md text-sm tracking-wider"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/authentication/register"
          className="border-light-bg-surface border p-2 rounded-md hover:bg-light-bg-surface transition-colors dark:border-dark-bg-surface dark:hover:bg-dark-bg-surface tracking-wider text-sm"
        >
          Registrarse
        </Link>
      </div>
    </div>
  );
}
