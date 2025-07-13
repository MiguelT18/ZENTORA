"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Asset, FavoriteAsset } from "@/utils/types";
import { useAuth } from "@/context/AuthContext";

interface AssetsContextType {
  activeAssets: Asset[];
  favoriteAssets: FavoriteAsset[];
  allAssets: Asset[];
  addAsset: (asset: Asset) => void;
  removeAsset: (assetId: string) => void;
  toggleFavorite: (asset: Asset) => void;
  searchAssets: (query: string) => Asset[];
  getFilteredAssets: (query: string) => Asset[];
}

const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

interface AssetsProviderProps {
  children: ReactNode;
}

// Datos de ejemplo para activos
const mockAssets: Asset[] = [
  {
    id: "btc-usd",
    symbol: "BTC/USD",
    name: "Bitcoin",
    price: 46653.5,
    change24h: 2.98,
    high24h: 49279.82,
    low24h: 40992.49,
    volume24h: 0,
    isFavorite: false,
  },
  {
    id: "eth-usd",
    symbol: "ETH/USD",
    name: "Ethereum",
    price: 3245.75,
    change24h: -1.23,
    high24h: 3350.2,
    low24h: 3180.1,
    volume24h: 0,
    isFavorite: false,
  },
  {
    id: "ada-usd",
    symbol: "ADA/USD",
    name: "Cardano",
    price: 0.485,
    change24h: 5.67,
    high24h: 0.495,
    low24h: 0.46,
    volume24h: 0,
    isFavorite: false,
  },
  {
    id: "sol-usd",
    symbol: "SOL/USD",
    name: "Solana",
    price: 98.45,
    change24h: 8.92,
    high24h: 102.3,
    low24h: 89.2,
    volume24h: 0,
    isFavorite: false,
  },
  {
    id: "dot-usd",
    symbol: "DOT/USD",
    name: "Polkadot",
    price: 7.23,
    change24h: -2.15,
    high24h: 7.45,
    low24h: 7.1,
    volume24h: 0,
    isFavorite: false,
  },
  {
    id: "link-usd",
    symbol: "LINK/USD",
    name: "Chainlink",
    price: 15.67,
    change24h: 3.45,
    high24h: 16.2,
    low24h: 15.1,
    volume24h: 0,
    isFavorite: false,
  },
  {
    id: "bnb-usd",
    symbol: "BNB/USD",
    name: "Binance Coin",
    price: 418.22,
    change24h: 1.8,
    high24h: 429.15,
    low24h: 400.75,
    volume24h: 0,
    isFavorite: false,
  },
  {
    id: "xrp-usd",
    symbol: "XRP/USD",
    name: "Ripple",
    price: 0.653,
    change24h: -0.5,
    high24h: 0.7,
    low24h: 0.62,
    volume24h: 0,
    isFavorite: false,
  },
  {
    id: "doge-usd",
    symbol: "DOGE/USD",
    name: "Dogecoin",
    price: 0.092,
    change24h: 4.3,
    high24h: 0.095,
    low24h: 0.088,
    volume24h: 0,
    isFavorite: false,
  },
  {
    id: "matic-usd",
    symbol: "MATIC/USD",
    name: "Polygon",
    price: 0.987,
    change24h: 2.1,
    high24h: 1.02,
    low24h: 0.96,
    volume24h: 0,
    isFavorite: false,
  },
  {
    id: "ltc-usd",
    symbol: "LTC/USD",
    name: "Litecoin",
    price: 82.5,
    change24h: -1.2,
    high24h: 84.1,
    low24h: 79.6,
    volume24h: 0,
    isFavorite: false,
  },
  {
    id: "usdt-usd",
    symbol: "USDT/USD",
    name: "Tether",
    price: 1.0,
    change24h: 0.01,
    high24h: 1.01,
    low24h: 0.99,
    volume24h: 0,
    isFavorite: false,
  },
  {
    id: "usdc-usd",
    symbol: "USDC/USD",
    name: "USD Coin",
    price: 1.0,
    change24h: 0.0,
    high24h: 1.0,
    low24h: 1.0,
    volume24h: 0,
    isFavorite: false,
  },
  {
    id: "avax-usd",
    symbol: "AVAX/USD",
    name: "Avalanche",
    price: 35.2,
    change24h: 6.7,
    high24h: 37.1,
    low24h: 33.4,
    volume24h: 0,
    isFavorite: false,
  },
  {
    id: "tron-usd",
    symbol: "TRX/USD",
    name: "Tron",
    price: 0.128,
    change24h: 0.8,
    high24h: 0.132,
    low24h: 0.124,
    volume24h: 0,
    isFavorite: false,
  },
];

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
