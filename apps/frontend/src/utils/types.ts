import { ReactNode } from "react";

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

// Interfaz para el tipo de chat
export interface Chat {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
  }>;
}

export type CandlestickDataProps = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export interface ChatContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
  openChatOptions: string | null;
  createNewChat: () => string;
  deleteChat: (chatId: string) => void;
  deleteAllChats: () => void;
  renameChat: (chatId: string, newTitle: string) => void;
  addMessageToCurrentChat: (message: { content: string; role: "user" | "assistant" }) => void;
  addMessageToChat: (
    chatId: string,
    message: { content: string; role: "user" | "assistant" }
  ) => void;
  setCurrentChat: (chatId: string) => void;
  setOpenChatOptions: (chatId: string | null) => void;
}

export interface ChatProviderProps {
  children: ReactNode;
}

export interface AssetsContextType {
  activeAssets: Asset[];
  favoriteAssets: FavoriteAsset[];
  allAssets: Asset[];
  addAsset: (asset: Asset) => void;
  removeAsset: (assetId: string) => void;
  toggleFavorite: (asset: Asset) => void;
  searchAssets: (query: string) => Asset[];
  getFilteredAssets: (query: string) => Asset[];
}

export interface AssetsProviderProps {
  children: ReactNode;
}
