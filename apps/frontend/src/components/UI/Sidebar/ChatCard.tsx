import { MainIcons } from "@/assets/icons";
import { AnimatedDropdown } from "@/components/UI/Dropdown";
import { useChat } from "@/context/ChatContext";
import { Chat } from "@/utils/types";
import { useEffect, useRef, useState } from "react";

interface ChatCardProps {
  chat: Chat;
  isCollapsed: boolean;
}

export default function ChatCard(props: ChatCardProps) {
  const { chat, isCollapsed } = props;

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const chatOptionsRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const {
    currentChatId,
    deleteChat,
    renameChat,
    setCurrentChat,
    chats,
    openChatOptions,
    setOpenChatOptions,
  } = useChat();

  // Función para obtener la referencia de un chat específico
  const getChatOptionsRef = (chatId: string) => ({
    current: chatOptionsRefs.current[chatId] || null,
  });

  const handleOpenChatOptions = (chatId: string) => {
    // Si el menú actual está abierto, lo cerramos
    // Si está cerrado o es un menú diferente, abrimos el nuevo y cerramos cualquier otro
    setOpenChatOptions(openChatOptions === chatId ? null : chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    deleteChat(chatId);
    setOpenChatOptions(null);
  };

  const handleRenameChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setEditingChatId(chatId);
      setEditingTitle(chat.title);
      setOpenChatOptions(null);
    }
  };

  const handleSaveTitle = (chatId: string) => {
    if (editingTitle.trim()) {
      renameChat(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleChatClick = (chatId: string) => {
    setCurrentChat(chatId);
  };

  // Cerrar menús de chat cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".chat-options-container")) {
        setOpenChatOptions(null);
      }
    };

    if (openChatOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openChatOptions, setOpenChatOptions]);

  return (
    <div
      className={`${editingChatId === chat.id && "bg-light-bg-surface dark:bg-dark-bg-surface"} ${
        currentChatId === chat.id &&
        "bg-secondary/10 dark:bg-primary/10 hover:border-secondary dark:hover:border-primary hover:bg-secondary/20 dark:hover:bg-primary/20 border border-secondary/20 dark:border-primary/20"
      } hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors p-2 rounded-md flex items-center justify-between group cursor-pointer`}
      onClick={() => handleChatClick(chat.id)}
    >
      <div className="flex-1 min-w-0 overflow-hidden">
        {editingChatId === chat.id ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveTitle(chat.id);
              } else if (e.key === "Escape") {
                handleCancelEdit();
              }
            }}
            onBlur={() => handleSaveTitle(chat.id)}
            className="text-sm bg-transparent border-none outline-none w-full text-light-text-primary dark:text-dark-text-primary"
            style={{
              maxWidth: isCollapsed ? "32px" : "160px",
              width: "100%",
              boxSizing: "border-box",
            }}
            autoFocus
          />
        ) : (
          <span className="block text-sm truncate max-w-[12rem]" title={chat.title}>
            {chat.title}
          </span>
        )}
      </div>

      <div
        className="relative h-fit opacity-0 group-hover:opacity-100 transition-opacity chat-options-container"
        ref={(el) => {
          chatOptionsRefs.current[chat.id] = el;
        }}
      >
        <button
          onClick={() => handleOpenChatOptions(chat.id)}
          type="button"
          className="cursor-pointer p-2 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors rounded-md"
        >
          <MainIcons.MoreVerticalIcon className="size-4 rotate-90" />
        </button>

        <AnimatedDropdown
          isOpen={openChatOptions === chat.id}
          position="left"
          triggerRef={getChatOptionsRef(chat.id)}
        >
          <button
            onClick={() => handleRenameChat(chat.id)}
            type="button"
            className="w-full cursor-pointer text-xs p-2 text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors tracking-wider flex items-center gap-2"
          >
            <MainIcons.EditIcon className="size-4" />
            Cambiar nombre
          </button>
          <button
            onClick={() => handleDeleteChat(chat.id)}
            type="button"
            className="w-full cursor-pointer text-xs p-2 text-error hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors tracking-wider flex items-center gap-2"
          >
            <MainIcons.TrashIcon className="size-4" />
            Eliminar
          </button>
        </AnimatedDropdown>
      </div>
    </div>
  );
}
