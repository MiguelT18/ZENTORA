import { createContext, useContext, useState, useEffect } from "react";

interface SubscriptionContextType {
  cuposTomados: number;
  cuposDisponibles: number;
  totalCupos: number;
  isLoaded: boolean;
  incrementarCupo: () => void;
  resetearCupos: () => void;
  porcentajeCompletado: number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription debe ser usado dentro de SubscriptionProvider");
  }
  return context;
};

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [cuposTomados, setCuposTomados] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const totalCupos = 50;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zentora_cupos_tomados");
      if (saved) {
        setCuposTomados(parseInt(saved, 10));
      }
      setIsLoaded(true);
    }
  }, []);

  const incrementarCupo = () => {
    if (cuposTomados < totalCupos) {
      const nuevosCupos = cuposTomados + 1;
      setCuposTomados(nuevosCupos);
      if (typeof window !== "undefined") {
        localStorage.setItem("zentora_cupos_tomados", nuevosCupos.toString());
      }
      if (nuevosCupos === totalCupos) {
        console.log(
          "🎉 ¡Cupos completados! Se han agotado todos los 50 cupos disponibles para la oferta especial."
        );
      }
    }
  };

  const resetearCupos = () => {
    setCuposTomados(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem("zentora_cupos_tomados");
    }
    console.log("🔄 Cupos reseteados a 0");
  };

  const cuposDisponibles = totalCupos - cuposTomados;
  const porcentajeCompletado = (cuposTomados / totalCupos) * 100;

  return (
    <SubscriptionContext.Provider
      value={{
        cuposTomados,
        cuposDisponibles,
        totalCupos,
        isLoaded,
        incrementarCupo,
        resetearCupos,
        porcentajeCompletado,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
