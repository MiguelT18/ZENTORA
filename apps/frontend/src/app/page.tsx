"use client";

import { useEffect, useRef, useState } from "react";
import { useNotification } from "@/context/NotificationContext";
import axios, { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import Loading from "./loading";
import Sidebar from "@/components/Layouts/Sidebar";
import MarketChart from "@/components/Layouts/MarketChart";
import AIChat from "@/components/Layouts/AIChat";

export default function Home() {
  const { addNotification } = useNotification();
  const { login, isLoading } = useAuth();

  const isProcessing = useRef(false);

  const [showLoading, setShowLoading] = useState(true);
  const [mobileView, setMobileView] = useState<"chart" | "chat">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mobileView");
      if (saved === "chart" || saved === "chat") return saved;
      else localStorage.setItem("mobileView", "chart");
    }
    return "chart";
  });

  useEffect(() => {
    localStorage.setItem("mobileView", mobileView);
  }, [mobileView]);

  useEffect(() => {
    if (!isLoading) {
      const timeout = setTimeout(() => setShowLoading(false), 200);
      return () => clearTimeout(timeout);
    } else {
      setShowLoading(true);
    }
  }, [isLoading]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tempCode = searchParams.get("temp_code");
    const errorParam = searchParams.get("error");

    // Mostrar mensaje de éxito tras verificación de email
    const successLoginMessage = localStorage.getItem("success_login_message");
    if (successLoginMessage) {
      addNotification("success", successLoginMessage);
      localStorage.removeItem("success_login_message");
    }

    if (errorParam) {
      addNotification("error", errorParam);
      searchParams.delete("error");
      const newUrl = window.location.pathname + (searchParams.toString() ? `?${searchParams}` : "");
      window.history.replaceState({}, document.title, newUrl);
    }

    if (tempCode && !isProcessing.current) {
      isProcessing.current = true;
      const exchangeTempCode = async () => {
        try {
          const res = await axios.post(
            "/api/v1/auth/exchange-temp-code",
            {
              temp_code: tempCode,
            },
            { withCredentials: true }
          );
          addNotification("success", res.data.message);
        } catch (e) {
          const error = e as AxiosError<{ detail: string }>;
          const errorMessage =
            error.response?.data?.detail || "Ha ocurrido un error al iniciar sesión";

          // Manejar errores específicos de DNS/conectividad
          if (
            errorMessage.includes("DNS") ||
            errorMessage.includes("conexión") ||
            errorMessage.includes("name resolution")
          ) {
            addNotification(
              "error",
              "Error de conectividad. Verifica tu conexión a internet y que los servicios DNS estén funcionando correctamente."
            );
          } else {
            addNotification("error", errorMessage);
          }
        } finally {
          // Elimina el temp_code de la URL después de usarlo, exitoso o no
          searchParams.delete("temp_code");
          const newUrl =
            window.location.pathname + (searchParams.toString() ? `?${searchParams}` : "");
          window.history.replaceState({}, document.title, newUrl);
        }
      };
      exchangeTempCode();
    }
  }, [addNotification, login]);

  if (showLoading) return <Loading />;

  return (
    <main className="h-dvh grid grid-cols-1 lg:grid-cols-[minmax(0.8,auto)_minmax(auto,3fr)_minmax(350px,1.20fr)]">
      <Sidebar />
      <MarketChart view={mobileView} />
      <AIChat view={mobileView} />

      <div className="lg:hidden flex items-center fixed left-1/2 -translate-x-1/2 bottom-4 dark:bg-dark-bg-surface/50 bg-light-bg-surface p-0.5 dark:border-dark-bg-surface border-light-bg-surface border-1 backdrop-blur-sm rounded-full">
        <button
          onClick={() => setMobileView("chart")}
          className={`px-4 py-2 rounded-full text-sm tracking-wider transition-all duration-300 ease-in-out transform
    ${
      mobileView === "chart"
        ? "bg-secondary dark:bg-primary text-white shadow-lg scale-105"
        : "text-theme-text-secondary hover:text-theme-text-primary scale-100"
    }`}
        >
          Gráfico
        </button>

        <button
          onClick={() => setMobileView("chat")}
          className={`px-4 py-2 rounded-full text-sm tracking-wider transition-all duration-300 ease-in-out transform
    ${
      mobileView === "chat"
        ? "bg-secondary dark:bg-primary text-white shadow-lg scale-105"
        : "text-theme-text-secondary hover:text-theme-text-primary scale-100"
    }`}
        >
          Chat
        </button>
      </div>
    </main>
  );
}
