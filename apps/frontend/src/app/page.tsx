"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useNotification } from "@/context/NotificationContext";
import axios from "axios";

export default function Home() {
  const { addNotification } = useNotification();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tempCode = searchParams.get("temp_code");

    if (tempCode) {
      const exchangeTempCode = async () => {
        try {
          const res = await axios.post("/api/v1/auth/exchange-temp-code", {
            temp_code: tempCode,
          });
          console.log(res.data);
          addNotification("success", res.data.message);
          localStorage.setItem("token", res.data.access_token);
        } catch (error: any) {
          addNotification("error", error.response.data.detail || "Ha ocurrido un error al iniciar sesión");
        }
      };
      exchangeTempCode();
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-4xl font-bold">Sistema de Autenticación</h1>
      <p className="text-lg my-4 text-text-secondary dark:text-text-secondary-dark">
        Bienvenido a nuestro sistema de login y registro
      </p>

      <div className="flex gap-4 items-center">
        <Link href="/user/login" className="text-white bg-primary hover:bg-primary/90 transition-colors p-2 rounded-md text-md tracking-wider font-roboto">
          Iniciar Sesión
        </Link>
        <Link href="/user/register" className="border-surface border p-2 rounded-md hover:bg-surface transition-colors dark:border-surface-dark dark:hover:bg-surface-dark font-roboto tracking-wider">
          Registrarse
        </Link>
      </div>
    </div>
  );
}
