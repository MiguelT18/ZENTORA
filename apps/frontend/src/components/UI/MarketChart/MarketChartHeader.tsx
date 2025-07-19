import { useEffect, useState } from "react";
import { GlobalIcons, MainIcons } from "@/assets/icons";
import { useAssets } from "@/context/AssetsContext";
import { formatPrice, formatVolume } from "@/utils/helpers";
import type { Asset } from "@/utils/types";
import type { Dispatch, SetStateAction } from "react";

interface MarketChartHeaderProps {
  activeAssets: Asset[];
  setIsModalOpen: (state: boolean) => void;
  handleToggleFavorite: (asset: Asset) => void;
  setSelectedAssetId: Dispatch<SetStateAction<string | null>>;
  selectedAssetId: string | null;
  selectedAsset: Asset | undefined;
}

export default function MarketChartHeader(props: MarketChartHeaderProps) {
  const {
    activeAssets,
    setIsModalOpen,
    setSelectedAssetId,
    selectedAsset,
    selectedAssetId,
    handleToggleFavorite,
  } = props;

  const [showNavigationButtons, setShowNavigationButtons] = useState(false);

  const { removeAsset } = useAssets();

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);

    // Hacer scroll a la pestaña seleccionada
    setTimeout(() => {
      const selectedTab = document.querySelector(`[data-asset-id="${assetId}"]`);
      if (selectedTab) {
        selectedTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }, 100);
  };

  const handleRemoveAsset = (assetId: string) => {
    removeAsset(assetId);
    // Si el activo removido era el seleccionado, seleccionar el primero disponible
    if (selectedAssetId === assetId) {
      const remainingAssets = activeAssets.filter((a) => a.id !== assetId);
      setSelectedAssetId(remainingAssets.length > 0 ? remainingAssets[0].id : null);
    }
  };

  // Detectar si se necesitan botones de navegación
  useEffect(() => {
    const checkScrollNeeded = () => {
      const container = document.getElementById("tabs-container");
      if (container) {
        const hasOverflow = container.scrollWidth > container.clientWidth;
        setShowNavigationButtons(hasOverflow);

        // Verificar que el contenedor no cause overflow en la página
        const parentContainer = container.closest("aside");
        if (parentContainer) {
          const parentRect = parentContainer.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          // Si el contenedor se extiende más allá de los límites del padre
          if (containerRect.right > parentRect.right) {
            container.style.maxWidth = `${parentRect.width - 100}px`; // Dejar espacio para botones
          }
        }
      }
    };

    checkScrollNeeded();

    // Verificar cuando cambian los activos
    const resizeObserver = new ResizeObserver(checkScrollNeeded);
    const container = document.getElementById("tabs-container");
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeAssets]);

  // Seleccionar el primer activo por defecto si no hay ninguno seleccionado
  useEffect(() => {
    if (!selectedAssetId && activeAssets.length > 0) {
      setSelectedAssetId(activeAssets[0].id);
    }
  }, [activeAssets, selectedAssetId, setSelectedAssetId]);

  return (
    <header className="min-w-0 w-full">
      <nav className="flex items-stretch justify-between md:gap-4 min-w-0 w-full max-w-full mb-4">
        {/* Contenedor principal de pestañas */}
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
          {/* Botón de navegación izquierda */}
          {showNavigationButtons && (
            <button
              onClick={() => {
                const container = document.getElementById("tabs-container");
                if (container) {
                  container.scrollLeft -= 200;
                }
              }}
              className="max-md:hidden flex-shrink-0 p-2 rounded-md text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors cursor-pointer ml-2"
              title="Desplazar izquierda"
            >
              <GlobalIcons.ArrowIcon className="size-4 rotate-180" />
            </button>
          )}

          {/* Pestañas de activos activos */}
          <div
            id="tabs-container"
            className="flex items-center gap-2 overflow-x-auto custom-scrollbar flex-1 min-w-0 max-w-full"
          >
            {activeAssets.map((asset: Asset) => (
              <div
                key={asset.id}
                data-asset-id={asset.id}
                className={`flex items-center gap-1.5 p-2 border-b-2 transition-colors cursor-pointer group flex-shrink-0 min-w-0 max-w-[200px] ${
                  selectedAssetId === asset.id
                    ? "border-secondary dark:border-primary bg-light-bg-secondary dark:bg-dark-bg-secondary"
                    : "border-transparent hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
                }`}
                onClick={() => handleSelectAsset(asset.id)}
              >
                <span
                  className={`block size-1.5 rounded-full flex-shrink-0 ${
                    asset.change24h >= 0 ? "bg-success" : "bg-error"
                  }`}
                />

                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-sm text-secondary dark:text-primary truncate max-w-[80px]">
                    {asset.symbol}
                  </span>
                  <span
                    className={`text-xs flex-shrink-0 ${
                      asset.change24h >= 0 ? "text-success" : "text-error"
                    }`}
                  >
                    {asset.change24h >= 0 ? "+" : ""}
                    {asset.change24h.toFixed(2)}%
                  </span>
                </div>

                {activeAssets.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAsset(asset.id);
                    }}
                    className="size-4 lg:opacity-0 group-hover:opacity-100 cursor-pointer p-0.5 rounded-full text-light-text-secondary dark:text-dark-text-secondary bg-light-bg-surface dark:bg-dark-bg-surface hover:bg-light-bg dark:hover:bg-dark-bg hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors flex-shrink-0"
                  >
                    <GlobalIcons.ExitIcon className="size-full" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Botón de navegación derecha */}
          {showNavigationButtons && (
            <button
              onClick={() => {
                const container = document.getElementById("tabs-container");
                if (container) {
                  container.scrollLeft += 200;
                }
              }}
              className="max-md:hidden flex-shrink-0 p-2 rounded-md text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors cursor-pointer mr-2"
              title="Desplazar derecha"
            >
              <GlobalIcons.ArrowIcon className="size-4" />
            </button>
          )}
        </div>

        <div className="flex-shrink-0 border-l border-light-bg-secondary dark:border-dark-bg-secondary box-border flex items-center px-2">
          <button
            onClick={() => setIsModalOpen(true)}
            type="button"
            className="size-8 p-2 text-light-text-secondary dark:text-dark-text-secondary bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-md hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors cursor-pointer"
          >
            <MainIcons.PlusIcon className="size-full" />
          </button>
        </div>
      </nav>

      {/* Información del activo seleccionado */}
      {selectedAsset && (
        <div className="w-full border-b border-light-bg-surface dark:border-dark-bg-surface overflow-x-auto">
          <div className="flex justify-around items-center gap-6 px-4 pb-4 min-w-max">
            <div className="flex justify-between flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg">{selectedAsset.symbol}</h1>
                <button
                  onClick={() => handleToggleFavorite(selectedAsset)}
                  title="Añadir a favoritos"
                  className={`size-5 transition-colors cursor-pointer ${
                    !selectedAsset.isFavorite
                      ? "text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary"
                      : "text-warning hover:text-warning/80"
                  }`}
                >
                  {selectedAsset.isFavorite ? (
                    <MainIcons.FavoriteOnIcon className="size-full" />
                  ) : (
                    <MainIcons.FavoriteOffIcon className="size-full" />
                  )}
                </button>
              </div>

              <span
                className={`text-sm flex items-center gap-1 ${
                  selectedAsset.change24h >= 0 ? "text-success" : "text-error"
                }`}
              >
                <GlobalIcons.ArrowIcon
                  className={`size-3 ${selectedAsset.change24h >= 0 ? "-rotate-90" : "rotate-90"}`}
                />
                {selectedAsset.change24h >= 0 ? "+" : ""}
                {selectedAsset.change24h.toFixed(2)}%
              </span>
            </div>

            <div className="flex flex-col [&>span]:block">
              <span className="text-light-text-secondary dark:text-dark-text-secondary text-sm">
                Precio Actual
              </span>
              <span className="text-light-text-primary dark:text-dark-text-primary text-lg font-bold">
                {formatPrice(selectedAsset.price)}
              </span>
            </div>

            <div className="[&>span]:block">
              <span className="text-light-text-secondary dark:text-dark-text-secondary text-sm">
                Máximo 24h
              </span>
              <span className="text-light-text-primary dark:text-dark-text-primary text-sm font-bold">
                {formatPrice(selectedAsset.high24h)}
              </span>
            </div>

            <div className="[&>span]:block">
              <span className="text-light-text-secondary dark:text-dark-text-secondary text-sm">
                Mínimo 24h
              </span>
              <span className="text-light-text-primary dark:text-dark-text-primary text-sm font-bold">
                {formatPrice(selectedAsset.low24h)}
              </span>
            </div>

            <div className="[&>span]:block">
              <span className="text-light-text-secondary dark:text-dark-text-secondary text-sm">
                Volúmen 24h
              </span>
              <span className="text-light-text-primary dark:text-dark-text-primary text-sm font-bold">
                {formatVolume(selectedAsset.volume24h)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay activos (solo si realmente no hay ninguno) */}
      {activeAssets.length === 0 && !selectedAsset && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="size-16 mb-4 text-light-text-secondary dark:text-dark-text-secondary">
            <MainIcons.PlusIcon className="size-full" />
          </div>
          <h3 className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            No hay activos añadidos
          </h3>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
            Añade activos para comenzar a analizar el mercado
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-secondary dark:bg-primary text-white rounded-md hover:bg-secondary/90 dark:hover:bg-primary/90 transition-colors"
          >
            Añadir Activo
          </button>
        </div>
      )}
    </header>
  );
}
