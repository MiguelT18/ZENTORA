"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Interfaz para el tipo de chat
interface Chat {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
  }>;
}

interface ChatContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const currentChat = chats.find((chat) => chat.id === currentChatId) || null;

  const createNewChat = () => {
    const baseTitle = "Nueva conversación";

    // Verificar si ya existe "Nueva conversación" sin número
    const hasBaseTitle = chats.some((chat) => chat.title === baseTitle);

    let title: string;
    if (!hasBaseTitle) {
      // Si no existe, usar el título base sin número
      title = baseTitle;
    } else {
      // Si existe, encontrar el siguiente número disponible
      let nextNumber = 1;
      while (chats.some((chat) => chat.title === `${baseTitle} (${nextNumber})`)) {
        nextNumber++;
      }
      title = `${baseTitle} (${nextNumber})`;
    }

    const newChat: Chat = {
      id: Date.now().toString(),
      title: title,
      messages: [],
    };

    setChats((prevChats) => [...prevChats, newChat]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  };

  const deleteChat = (chatId: string) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));

    // Si el chat eliminado era el actual, limpiar la selección
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  const deleteAllChats = () => {
    setChats([]);
    setCurrentChatId(null);
  };

  const renameChat = (chatId: string, newTitle: string) => {
    if (newTitle.trim()) {
      setChats((prevChats) =>
        prevChats.map((chat) => (chat.id === chatId ? { ...chat, title: newTitle.trim() } : chat))
      );
    }
  };

  const addMessageToCurrentChat = (message: { content: string; role: "user" | "assistant" }) => {
    if (!currentChatId) return;

    const newMessage = {
      id: Date.now().toString() + `-${message.role}`,
      content: message.content,
      role: message.role,
      timestamp: new Date(),
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === currentChatId ? { ...chat, messages: [...chat.messages, newMessage] } : chat
      )
    );
  };

  const addMessageToChat = (
    chatId: string,
    message: { content: string; role: "user" | "assistant" }
  ) => {
    const newMessage = {
      id: Date.now().toString() + `-${message.role}`,
      content: message.content,
      role: message.role,
      timestamp: new Date(),
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, messages: [...chat.messages, newMessage] } : chat
      )
    );
  };

  const setCurrentChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const value: ChatContextType = {
    chats,
    currentChatId,
    currentChat,
    createNewChat,
    deleteChat,
    deleteAllChats,
    renameChat,
    addMessageToCurrentChat,
    addMessageToChat,
    setCurrentChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
