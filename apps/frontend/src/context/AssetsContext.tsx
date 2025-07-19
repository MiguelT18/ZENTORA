"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Asset, FavoriteAsset, AssetsContextType, AssetsProviderProps } from "@/utils/types";
import { useAuth } from "@/context/AuthContext";
import mockAssets from "@/mocks/assets.json";

const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

export const AssetsProvider: React.FC<AssetsProviderProps> = ({ children }) => {
  const [activeAssets, setActiveAssets] = useState<Asset[]>([]);
  const [favoriteAssets, setFavoriteAssets] = useState<FavoriteAsset[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>(mockAssets);
  const { user } = useAuth();

  // Cargar datos guardados al inicializar
  useEffect(() => {
    const savedActiveAssets = localStorage.getItem("zentora_active_assets");

    if (savedActiveAssets) {
      try {
        const parsed = JSON.parse(savedActiveAssets);
        setActiveAssets(parsed);
      } catch (error) {
        console.error("Error al cargar activos activos:", error);
        // Si hay error, establecer BTC como activo por defecto
        const defaultAsset = mockAssets.find((asset) => asset.id === "btc-usd");
        if (defaultAsset) {
          setActiveAssets([defaultAsset]);
        }
      }
    } else {
      // Si no hay activos guardados, establecer BTC como activo por defecto
      const defaultAsset = mockAssets.find((asset) => asset.id === "btc-usd");
      if (defaultAsset) {
        setActiveAssets([defaultAsset]);
      }
    }

    // Los favoritos ya no se cargan desde localStorage, solo existen en sesión
  }, []);

  // Limpiar favoritos cuando el usuario cierre sesión
  useEffect(() => {
    if (!user) {
      setFavoriteAssets([]);
      // También resetear el estado isFavorite en todos los activos
      setAllAssets((prev) => prev.map((asset) => ({ ...asset, isFavorite: false })));
      setActiveAssets((prev) => prev.map((asset) => ({ ...asset, isFavorite: false })));
    }
  }, [user]);

  // Guardar solo activos activos cuando cambien (los favoritos no se persisten)
  useEffect(() => {
    localStorage.setItem("zentora_active_assets", JSON.stringify(activeAssets));
  }, [activeAssets]);

  const addAsset = (asset: Asset) => {
    if (!activeAssets.find((a) => a.id === asset.id)) {
      setActiveAssets((prev) => [...prev, asset]);
    }
  };

  const removeAsset = (assetId: string) => {
    setActiveAssets((prev) => prev.filter((asset) => asset.id !== assetId));
  };

  const toggleFavorite = (asset: Asset) => {
    const updatedAsset = { ...asset, isFavorite: !asset.isFavorite };

    // Actualizar en allAssets
    setAllAssets((prev) => prev.map((a) => (a.id === asset.id ? updatedAsset : a)));

    // Actualizar en activeAssets si está activo
    setActiveAssets((prev) => prev.map((a) => (a.id === asset.id ? updatedAsset : a)));

    // Actualizar en favoriteAssets
    if (updatedAsset.isFavorite) {
      const favoriteAsset: FavoriteAsset = {
        ...updatedAsset,
        addedAt: new Date(),
      };
      setFavoriteAssets((prev) => [...prev, favoriteAsset]);
    } else {
      setFavoriteAssets((prev) => prev.filter((fa) => fa.id !== asset.id));
    }
  };

  const searchAssets = (query: string): Asset[] => {
    if (!query.trim()) return allAssets;

    const lowerQuery = query.toLowerCase();
    return allAssets.filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(lowerQuery) ||
        asset.name.toLowerCase().includes(lowerQuery)
    );
  };

  const getFilteredAssets = (query: string): Asset[] => {
    const searchResults = searchAssets(query);
    const favorites = favoriteAssets.map((fa) => ({ ...fa, isFavorite: true }));

    // Combinar resultados de búsqueda con favoritos, evitando duplicados
    const combined = [...searchResults];

    favorites.forEach((favorite) => {
      if (!combined.find((asset) => asset.id === favorite.id)) {
        combined.push(favorite);
      }
    });

    return combined;
  };

  const value: AssetsContextType = {
    activeAssets,
    favoriteAssets,
    allAssets,
    addAsset,
    removeAsset,
    toggleFavorite,
    searchAssets,
    getFilteredAssets,
  };

  return <AssetsContext.Provider value={value}>{children}</AssetsContext.Provider>;
};

export const useAssets = () => {
  const context = useContext(AssetsContext);
  if (context === undefined) {
    throw new Error("useAssets debe ser usado dentro de un AssetsProvider");
  }
  return context;
};
