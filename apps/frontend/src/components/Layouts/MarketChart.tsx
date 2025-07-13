import { GlobalIcons, MainIcons } from "@/assets/icons";
import { useState, useEffect } from "react";
import type { view, Asset } from "@/utils/types";
import Modal from "@/components/UI/Modal";
import { useAssets } from "@/context/AssetsContext";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useRouter } from "next/navigation";

// Estilos para scrollbar personalizada oculta
const scrollbarStyles = `
  .custom-scrollbar {
    scrollbar-width: none;
  }
  .custom-scrollbar::-webkit-scrollbar {
    height: 0;
    width: 0;
  }
`;

export default function MarketChart({ view }: { view: view }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"favorites" | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showNavigationButtons, setShowNavigationButtons] = useState(false);
  const itemsPerPage = 10;

  const { activeAssets, favoriteAssets, addAsset, removeAsset, toggleFavorite, getFilteredAssets } =
    useAssets();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const router = useRouter();

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSearchQuery("");
    setActiveTab("all");
    setCurrentPage(1);
  };

  const handleAddAsset = (asset: Asset) => {
    addAsset(asset);
    setIsModalOpen(false);
    setSearchQuery("");
  };

  const handleRemoveAsset = (assetId: string) => {
    removeAsset(assetId);
    // Si el activo removido era el seleccionado, seleccionar el primero disponible
    if (selectedAssetId === assetId) {
      const remainingAssets = activeAssets.filter((a) => a.id !== assetId);
      setSelectedAssetId(remainingAssets.length > 0 ? remainingAssets[0].id : null);
    }
  };

  const handleToggleFavorite = (asset: Asset) => {
    // Verificar si el usuario está autenticado
    if (!user) {
      addNotification("error", "Debes iniciar sesión para añadir activos a favoritos");
      return;
    }

    // Si está autenticado, proceder con la acción normal
    toggleFavorite(asset);
  };

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

  // Seleccionar el primer activo por defecto si no hay ninguno seleccionado
  useEffect(() => {
    if (!selectedAssetId && activeAssets.length > 0) {
      setSelectedAssetId(activeAssets[0].id);
    }
  }, [activeAssets, selectedAssetId]);

  const selectedAsset = activeAssets.find((asset) => asset.id === selectedAssetId);

  // Obtener activos según la pestaña activa
  const getAssetsForCurrentTab = () => {
    if (activeTab === "favorites") {
      return favoriteAssets.filter(
        (asset) =>
          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return getFilteredAssets(searchQuery);
  };

  const filteredAssets = getAssetsForCurrentTab();

  // Calcular paginación
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  // Resetear página cuando cambia la búsqueda o pestaña
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume === 0) return "0.00 B";
    const billions = volume / 1e9;
    return `${billions.toFixed(2)} B`;
  };

  // Función para resaltar texto que coincide con la búsqueda
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="text-secondary dark:text-primary font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Funciones para manejar paginación
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <aside
      className={`${
        view === "chart" ? "max-lg:block" : "max-lg:hidden"
      } min-w-0 overflow-hidden w-full h-full flex flex-col`}
    >
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      {/* Modal para añadir activos */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="lg">
        <div className="p-4">
          <header className="mb-4">
            <nav className="flex items-center justify-between mb-2">
              <h1 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">
                Añadir Activo
              </h1>

              <button
                onClick={handleCloseModal}
                type="button"
                aria-label="Cerrar modal"
                className="p-2 rounded-md text-light-text-primary dark:text-dark-text-primary dark:bg-dark-bg-secondary cursor-pointer dark:hover:bg-dark-bg-surface dark:hover:text-dark-text-secondary hover:bg-light-bg-surface hover:text-light-text-secondary transition-colors"
              >
                <GlobalIcons.ExitIcon className="size-6" />
              </button>
            </nav>

            {/* Pestañas */}
            <div className="flex border-b border-light-bg-surface dark:border-dark-bg-surface mb-4">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  activeTab === "all"
                    ? "text-secondary dark:text-primary border-b-2 border-secondary dark:border-primary"
                    : "text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary cursor-pointer"
                }`}
              >
                Todos los Activos
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  activeTab === "favorites"
                    ? "text-secondary dark:text-primary border-b-2 border-secondary dark:border-primary"
                    : "text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary cursor-pointer"
                }`}
              >
                Favoritos ({favoriteAssets.length})
              </button>
            </div>

            <input
              type="search"
              placeholder={
                activeTab === "favorites" ? "Buscar en favoritos..." : "Buscar activos..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-secondary focus:border-secondary dark:focus:ring-primary dark:focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50 hover:border-secondary/50 dark:hover:border-primary/50 transition-colors"
            />
          </header>

          {/* Lista de activos */}
          <div className="max-h-96 overflow-y-auto">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
                {activeTab === "favorites"
                  ? "No se encontraron favoritos"
                  : "No se encontraron activos"}
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedAssets.map((asset) => {
                  const isActive = activeAssets.some((a) => a.id === asset.id);
                  const isFavorite = favoriteAssets.some((fa) => fa.id === asset.id);

                  return (
                    <div
                      key={asset.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isActive
                          ? "border-secondary dark:border-primary bg-light-bg-secondary dark:bg-dark-bg-secondary"
                          : "border-light-bg-surface dark:border-dark-bg-surface hover:border-secondary dark:hover:border-primary"
                      }`}
                      onClick={() => {
                        if (!isActive) {
                          handleAddAsset(asset);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                              {highlightText(asset.symbol, searchQuery)}
                            </span>
                            <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                              {highlightText(asset.name, searchQuery)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
                              {formatPrice(asset.price)}
                            </span>
                            <span
                              className={`text-xs ${
                                asset.change24h >= 0 ? "text-success" : "text-error"
                              }`}
                            >
                              {asset.change24h >= 0 ? "+" : ""}
                              {asset.change24h.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(asset);
                        }}
                        className={`size-5 transition-colors ${
                          isFavorite
                            ? "text-warning hover:text-warning/80"
                            : "text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary cursor-pointer"
                        }`}
                      >
                        {isFavorite ? (
                          <MainIcons.FavoriteOnIcon className="size-full" />
                        ) : (
                          <MainIcons.FavoriteOffIcon className="size-full" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Controles de paginación */}
          {filteredAssets.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-light-bg-surface dark:border-dark-bg-surface">
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAssets.length)} de{" "}
                {filteredAssets.length} activos
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <GlobalIcons.ArrowIcon className="size-4 rotate-90" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                          currentPage === pageNumber
                            ? "bg-secondary dark:bg-primary text-white"
                            : "text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface cursor-pointer"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <GlobalIcons.ArrowIcon className="size-4 -rotate-90" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <header className="min-w-0 w-full">
        <nav className="flex items-center justify-between md:gap-4 min-w-0 w-full h-fit max-w-full">
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
              {activeAssets.map((asset) => (
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
                      className="size-4 opacity-0 group-hover:opacity-100 cursor-pointer p-0.5 rounded-full text-light-text-secondary dark:text-dark-text-secondary bg-light-bg-surface dark:bg-dark-bg-surface hover:bg-light-bg dark:hover:bg-dark-bg hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors flex-shrink-0"
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

          <div className="flex-shrink-0 p-2 border-l border-light-bg-secondary dark:border-dark-bg-secondary">
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
          <div className="flex justify-around items-center gap-6 p-4 border-b border-light-bg-surface dark:border-dark-bg-surface overflow-x-auto">
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

      <main className="flex-1 min-w-0 overflow-hidden"></main>

      <footer className="min-w-0"></footer>
    </aside>
  );
}
