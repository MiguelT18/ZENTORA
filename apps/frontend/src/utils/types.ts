export interface ModalNotification {
  message: string;
  type: "error" | "success" | "warning" | "info";
}

export interface User {
  avatar_url: string;
  bio: string;
  created_at: string;
  email: string;
  full_name: string;
  id: string;
  is_verified: boolean;
  provider: string;
  role: string;
  status: string;
  updated_at: string;
}

export type view = "chart" | "chat";

// Interfaces para activos
export interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  isFavorite: boolean;
}

export interface FavoriteAsset extends Asset {
  addedAt: Date;
}
