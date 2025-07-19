import React, { useEffect, useState } from "react";
import { GlobalIcons, MainIcons } from "@/assets/icons";
import Modal from "@/components/UI/Modal";
import { useAssets } from "@/context/AssetsContext";
import { formatPrice } from "@/utils/helpers";
import type { Asset } from "@/utils/types";
import type { Dispatch, SetStateAction } from "react";

interface MarketAssetsModalProps {
  isModalOpen: boolean;
  activeAssets: Asset[];
  handleToggleFavorite: (asset: Asset) => void;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function MarketAssetsModal(props: MarketAssetsModalProps) {
  const { isModalOpen, activeAssets, handleToggleFavorite, setIsModalOpen } = props;

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"favorites" | "all">("all");

  const itemsPerPage = 10;

  const { addAsset, getFilteredAssets, favoriteAssets } = useAssets();

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

  // Resetear página cuando cambia la búsqueda o pestaña
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  return (
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
            placeholder={activeTab === "favorites" ? "Buscar en favoritos..." : "Buscar activos..."}
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
                          ? "bg-secondary dark:bg-primary text-white hover:cursor-not-allowed"
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
  );
}
