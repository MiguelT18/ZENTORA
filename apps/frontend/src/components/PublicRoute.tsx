"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/"); // Redirige a inicio si ya está autenticado
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div>Cargando...</div>;
  if (user) return null;
  return <>{children}</>;
}

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/authentication/login"); // Redirige a login si no está autenticado
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div>Cargando...</div>;
  if (!user) return null;
  return <>{children}</>;
}
