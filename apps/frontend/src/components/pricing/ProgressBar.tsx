import { GlobalIcons } from "@/assets/icons";
import React from "react";

interface ProgressBarProps {
  porcentaje: number;
  cuposTomados: number;
  cuposDisponibles: number;
  isLoaded: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  porcentaje,
  cuposTomados,
  cuposDisponibles,
  isLoaded,
}) => {
  const getProgressColor = (porcentaje: number) => {
    if (porcentaje >= 80) return "bg-error";
    if (porcentaje >= 60) return "bg-warning";
    return "bg-success";
  };

  const getProgressTextColor = (porcentaje: number) => {
    if (porcentaje >= 80) return "text-error";
    if (porcentaje >= 60) return "text-warning";
    return "text-success";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span
          className={`font-bold text-sm flex items-center gap-1 ${getProgressTextColor(
            porcentaje
          )}`}
        >
          <GlobalIcons.InfoIcon className="size-4" />
          {!isLoaded
            ? "Cargando..."
            : cuposDisponibles > 0
            ? `Solo quedan ${cuposDisponibles} cupos`
            : "¡Cupos agotados!"}
        </span>
        <span className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary">
          {isLoaded ? `${cuposTomados}/50` : "..."}
        </span>
      </div>

      <div className="relative w-full h-3 bg-light-bg dark:bg-dark-bg rounded-full overflow-hidden">
        {isLoaded ? (
          <>
            <div
              className={`h-full transition-all duration-1000 ease-out ${getProgressColor(
                porcentaje
              )} relative`}
              style={{ width: `${porcentaje}%` }}
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>

            {/* Marcadores de progreso */}
            {[20, 40, 60, 80, 100].map((marker) => (
              <div
                key={marker}
                className="absolute top-0 w-px h-full bg-black/30 dark:bg-white/30"
                style={{ left: `${marker}%` }}
              />
            ))}
          </>
        ) : (
          <div className="h-full bg-gradient-to-r from-secondary/20 to-primary/20 animate-pulse"></div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-light-text-secondary dark:text-dark-text-secondary">
          {isLoaded ? `${cuposTomados} cupos tomados` : "Cargando..."}
        </span>
        <span className={`font-bold ${getProgressTextColor(porcentaje)}`}>
          {isLoaded ? `${porcentaje.toFixed(0)}% completado` : "..."}
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;
