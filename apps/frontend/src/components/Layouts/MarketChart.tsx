import { MainIcons } from "@/assets/icons";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAssets } from "@/context/AssetsContext";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useTheme } from "@/context/ThemeContext";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import MarketChartHeader from "@/components/UI/MarketChart/MarketChartHeader";
import MarketChartControls from "@/components/UI/MarketChart/MarketChartControls";
import MarketAssetsModal from "@/components/UI/MarketChart/MarketAssetsModal";
import CandlestickData from "@/mocks/candlestick-data.json.json";
import type { view, Asset, CandlestickDataProps } from "@/utils/types";

export default function MarketChart({ view }: { view: view }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawingDropdownOpen, setDrawingDropdownOpen] = useState(false);
  const [indicatorsDropdownOpen, setIndicatorsDropdownOpen] = useState(false);
  const [optionsDropdownOpen, setOptionsDropdownOpen] = useState(false);
  const [timeframeDropdownOpen, setTimeframeDropdownOpen] = useState(false);
  const [chartTypeDropdownOpen, setChartTypeDropdownOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedControls, setSelectedControls] = useState({
    timeframe: "1d",
    chartType: "candlestick",
    drawTool: "cursor",
    indicator: "",
    more: "",
  });

  // Referencias para los dropdowns
  const drawingDropdownRef = useRef<HTMLButtonElement>(null);
  const indicatorsDropdownRef = useRef<HTMLButtonElement>(null);
  const optionsDropdownRef = useRef<HTMLButtonElement>(null);
  const timeframeDropdownRef = useRef<HTMLButtonElement>(null);
  const chartTypeDropdownRef = useRef<HTMLButtonElement>(null);

  const { activeAssets, toggleFavorite } = useAssets();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { currentTheme } = useTheme();

  // Referencias para el gráfico
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const candlestickSeriesRef = useRef<ReturnType<
    ReturnType<typeof createChart>["addSeries"]
  > | null>(null);

  const handleToggleFavorite = (asset: Asset) => {
    // Verificar si el usuario está autenticado
    if (!user) {
      addNotification("error", "Debes iniciar sesión para añadir activos a favoritos");
      return;
    }

    // Si está autenticado, proceder con la acción normal
    toggleFavorite(asset);
  };

  const selectedAsset = activeAssets.find((asset) => asset.id === selectedAssetId);

  // Función para inicializar el gráfico
  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current) return;

    // Limpiar gráfico existente
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (_error) {
        console.log("Chart already disposed");
      }
    }

    const isDark = currentTheme === "dark";

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#121212" : "#ffffff" },
        textColor: isDark ? "#f5f5f5" : "#111111",
      },
      grid: {
        vertLines: { color: isDark ? "#1e1e1e" : "#eeeeee" },
        horzLines: { color: isDark ? "#1e1e1e" : "#eeeeee" },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: isDark ? "#6366f1" : "#14b8a6",
          width: 1,
          style: 3,
        },
        horzLine: {
          color: isDark ? "#6366f1" : "#14b8a6",
          width: 1,
          style: 3,
        },
      },
      rightPriceScale: {
        borderColor: isDark ? "#1e1e1e" : "#eeeeee",
        textColor: isDark ? "#aaaaaa" : "#666666",
      },
      timeScale: {
        borderColor: isDark ? "#1e1e1e" : "#eeeeee",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Crear serie de velas usando la API correcta
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    // Agregar datos
    candlestickSeries.setData(CandlestickData);

    // Ajustar escala de tiempo
    chart.timeScale().fitContent();

    // Configurar tooltip
    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.seriesData.get(candlestickSeries)) {
        const data = param.seriesData.get(candlestickSeries) as CandlestickDataProps;
        // Aquí podrías mostrar información adicional en un tooltip personalizado
      }
    });

    // Manejar redimensionamiento
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Guardar referencias
    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        chart.remove();
      } catch (_error) {
        console.log("Chart already disposed during cleanup");
      }
    };
  }, [currentTheme]);

  // Inicializar gráfico cuando se monte el componente o cambie el tema
  useEffect(() => {
    if (chartContainerRef.current && selectedAsset) {
      const cleanup = initializeChart();
      return cleanup;
    }
  }, [initializeChart, selectedAsset]);

  // Inicializar gráfico cuando el contenedor esté disponible
  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      const cleanup = initializeChart();
      return cleanup;
    }
  }, [initializeChart]);

  // Detectar cambios en el sidebar y ajustar el gráfico
  useEffect(() => {
    const handleSidebarChange = () => {
      if (chartRef.current && chartContainerRef.current) {
        setTimeout(() => {
          try {
            chartRef.current?.applyOptions({
              width: chartContainerRef.current?.clientWidth || 0,
              height: chartContainerRef.current?.clientHeight || 0,
            });
          } catch (error) {
            console.log("Error adjusting chart size:", error);
          }
        }, 100);
      }
    };

    // Observar cambios en el contenedor del gráfico
    const resizeObserver = new ResizeObserver(handleSidebarChange);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedAsset]);

  // Función para cerrar todos los dropdowns
  const closeAllDropdowns = () => {
    setDrawingDropdownOpen(false);
    setIndicatorsDropdownOpen(false);
    setOptionsDropdownOpen(false);
    setTimeframeDropdownOpen(false);
    setChartTypeDropdownOpen(false);
  };

  // Función para abrir un dropdown específico y cerrar los demás
  const openDropdown = (dropdownType: string) => {
    closeAllDropdowns();
    switch (dropdownType) {
      case "drawing":
        setDrawingDropdownOpen(true);
        break;
      case "indicators":
        setIndicatorsDropdownOpen(true);
        break;
      case "options":
        setOptionsDropdownOpen(true);
        break;
      case "timeframe":
        setTimeframeDropdownOpen(true);
        break;
      case "chartType":
        setChartTypeDropdownOpen(true);
        break;
    }
  };

  // Detectar clics fuera de los dropdowns para cerrarlos
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Verificar si el clic fue fuera de todos los dropdowns y sus botones trigger
      const isOutsideAllDropdowns = [
        drawingDropdownRef.current,
        indicatorsDropdownRef.current,
        optionsDropdownRef.current,
        timeframeDropdownRef.current,
        chartTypeDropdownRef.current,
      ].every((ref) => !ref?.contains(target));

      // Verificar si el clic fue en un elemento del dropdown (portal)
      const dropdownPortal = document.getElementById("dropdown-portal");
      const isInDropdownPortal = dropdownPortal?.contains(target);

      if (isOutsideAllDropdowns && !isInDropdownPortal) {
        closeAllDropdowns();
      }
    };

    // Solo agregar el listener si algún dropdown está abierto
    if (
      drawingDropdownOpen ||
      indicatorsDropdownOpen ||
      optionsDropdownOpen ||
      timeframeDropdownOpen ||
      chartTypeDropdownOpen
    ) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [
    drawingDropdownOpen,
    indicatorsDropdownOpen,
    optionsDropdownOpen,
    timeframeDropdownOpen,
    chartTypeDropdownOpen,
  ]);

  return (
    <aside
      className={`${
        view === "chart" ? "max-lg:block" : "max-lg:hidden"
      } min-w-0 overflow-hidden size-full flex flex-col`}
    >
      {/* Modal para añadir activos */}
      <MarketAssetsModal
        activeAssets={activeAssets}
        handleToggleFavorite={handleToggleFavorite}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />

      <MarketChartHeader
        activeAssets={activeAssets}
        handleToggleFavorite={handleToggleFavorite}
        selectedAsset={selectedAsset}
        selectedAssetId={selectedAssetId}
        setIsModalOpen={setIsModalOpen}
        setSelectedAssetId={setSelectedAssetId}
      />

      <main className="flex-1 min-w-0 overflow-hidden p-4">
        {selectedAsset ? (
          <section className="w-full h-full flex flex-col">
            {/* Barra de navegación del gráfico */}
            <MarketChartControls
              selectedControls={selectedControls}
              setSelectedControls={setSelectedControls}
              chartTypeDropdownOpen={chartTypeDropdownOpen}
              chartTypeDropdownRef={chartTypeDropdownRef}
              drawingDropdownOpen={drawingDropdownOpen}
              drawingDropdownRef={drawingDropdownRef}
              indicatorsDropdownOpen={indicatorsDropdownOpen}
              indicatorsDropdownRef={indicatorsDropdownRef}
              openDropdown={openDropdown}
              optionsDropdownOpen={optionsDropdownOpen}
              optionsDropdownRef={optionsDropdownRef}
              setChartTypeDropdownOpen={setChartTypeDropdownOpen}
              setTimeframeDropdownOpen={setTimeframeDropdownOpen}
              timeframeDropdownOpen={timeframeDropdownOpen}
              timeframeDropdownRef={timeframeDropdownRef}
            />

            <div
              ref={chartContainerRef}
              className="flex-1 w-full min-h-[400px] border border-light-bg-surface dark:border-dark-bg-surface rounded-lg"
            />
          </section>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="size-16 mb-4 text-light-text-secondary dark:text-dark-text-secondary mx-auto">
                <MainIcons.PlusIcon className="size-full" />
              </div>
              <h3 className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Selecciona un activo
              </h3>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Selecciona un activo de la lista para ver su gráfico
              </p>
            </div>
          </div>
        )}
      </main>
    </aside>
  );
}
