import { GlobalIcons } from "@/assets/icons";
import { MainIcons } from "@/assets/icons";
import { AnimatedDropdown } from "@/components/UI/Dropdown";
import { ProPlanTag } from "@/components/UI/PlanTag";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Modal from "@/components/UI/Modal";
import SettingsMenu from "@/components/UserSettings/SettingsMenu";

// Interfaz para el tipo de chat
interface Chat {
  id: string;
  title: string;
}

export default function Sidebar() {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [moreMenu, setMoreMenu] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [openChatOptions, setOpenChatOptions] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const chatOptionsRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Función para obtener la referencia de un chat específico
  const getChatOptionsRef = (chatId: string) => ({
    current: chatOptionsRefs.current[chatId] || null,
  });

  const handleOpenMoreMenu = () => {
    setMoreMenu(!moreMenu);
  };

  const handleOpenChatOptions = (chatId: string) => {
    setOpenChatOptions(openChatOptions === chatId ? null : chatId);
  };

  const handleCreateNewChat = () => {
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
    };

    setChats((prevChats) => [...prevChats, newChat]);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    setOpenChatOptions(null);
  };

  const handleDeleteAllChats = () => {
    setChats([]);
    setMoreMenu(false);
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
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId ? { ...chat, title: editingTitle.trim() } : chat
        )
      );
    }
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleOpenSettings = () => {
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsModalOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenu(false);
      }
    };

    if (moreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [moreMenu]);

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
  }, [openChatOptions]);

  return (
    <aside
      className={`h-dvh hidden lg:grid grid-rows-[auto_1fr_auto] dark:bg-dark-bg-secondary bg-light-bg-secondary transition-all duration-300 ${
        isCollapsed ? "w-13" : "w-64"
      }`}
    >
      <header className="py-4 px-2">
        <div className="flex items-center justify-between mb-2">
          <div
            className={`flex flex-col justify-center items-center gap-1 ${
              isCollapsed ? "hidden" : ""
            }`}
          >
            <GlobalIcons.LogoIcon className="text-black dark:text-white size-12" />
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="size-9 cursor-pointer bg-light-bg dark:bg-dark-bg border-light-bg-surface border p-2 rounded-md hover:bg-light-bg-surface/50 transition-colors dark:border-dark-bg-surface dark:hover:bg-dark-bg-surface/50"
          >
            {isCollapsed ? (
              <MainIcons.MenuUnfoldIcon className="size-full" />
            ) : (
              <MainIcons.MenuFoldIcon className="size-full" />
            )}
          </button>
        </div>

        {user ? (
          <div
            className={`bg-light-bg-surface dark:bg-dark-bg-surface p-2 rounded-lg ${
              isCollapsed ? "hidden" : ""
            }`}
          >
            <div className="flex gap-2 items-center">
              {user.avatar_url ? (
                <Image
                  className="size-10 rounded-full"
                  src={user.avatar_url}
                  alt={`Foto de perfil de ${user.full_name}`}
                  width={80}
                  height={80}
                  priority
                />
              ) : (
                <div className="size-10 text-sm bg-secondary dark:bg-primary rounded-full flex items-center justify-center text-white">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                </div>
              )}

              <div className="space-y-1">
                <span className="text-light-text-primary dark:text-dark-text-primary text-sm font-bold block">
                  {user.full_name}
                </span>
                <span className="block text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        ) : (
          ""
        )}
      </header>

      <main className={`overflow-y-auto ${user ? "block" : "flex items-center"}`}>
        {!user ? (
          <div
            className={`text-center space-y-1 px-4 whitespace-nowrap ${
              isCollapsed ? "hidden" : ""
            }`}
          >
            <MainIcons.ChatIcon className="dark:text-primary text-secondary size-8 mx-auto block" />
            <h3 className="text-md font-bold text-light-text-primary dark:text-dark-text-primary block">
              Bienvenido a Zentora
            </h3>
            <p className="text-sm text-pretty text-light-text-secondary dark:text-dark-text-secondary block">
              Inicia sesión para acceder a tu historial de conversaciones con Nexa y análisis
              personalizados.
            </p>
          </div>
        ) : (
          <>
            <header
              className={`${
                isCollapsed && "hidden"
              } px-2 pb-2 flex items-center justify-between border-b border-light-bg-surface dark:border-dark-bg-surface`}
            >
              <div className="flex items-center justify-between gap-2">
                <MainIcons.ChatIcon className="size-5 text-light-text-secondary dark:text-dark-text-secondary" />
                <span className="text-xs text-light-text-primary dark:text-dark-text-primary">
                  Chats ({chats.length})
                </span>
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleCreateNewChat}
                  className="cursor-pointer p-2 rounded-md transition-colors hover:text-light-text-secondary dark:hover:text-dark-text-secondary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface"
                  title="Crear nueva conversación"
                >
                  <MainIcons.PlusIcon className="size-4" />
                </button>
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={handleOpenMoreMenu}
                    type="button"
                    className={`cursor-pointer p-2 rounded-md transition-colors hover:text-light-text-secondary dark:hover:text-dark-text-secondary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface dark:disabled:text-dark-text-disabled disabled:text-light-text-disabled disabled:cursor-not-allowed disabled:bg-transparent ${
                      moreMenu
                        ? "bg-light-bg-surface dark:bg-dark-bg-surface text-light-text-secondary dark:text-dark-text-secondary"
                        : ""
                    }`}
                    disabled={chats.length === 0}
                  >
                    <MainIcons.MoreVerticalIcon className="size-4" />
                  </button>

                  <AnimatedDropdown isOpen={moreMenu} position="left" triggerRef={moreMenuRef}>
                    <button
                      onClick={handleDeleteAllChats}
                      type="button"
                      className="w-full cursor-pointer text-xs p-2 text-error hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors tracking-wider flex items-center gap-2"
                      disabled={chats.length === 0}
                    >
                      <MainIcons.TrashIcon className="size-4" />
                      Eliminar todos
                    </button>
                  </AnimatedDropdown>
                </div>
              </div>
            </header>

            <section className={`${isCollapsed && "hidden"} p-2`}>
              {chats.length === 0 ? (
                <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
                  <MainIcons.ChatIcon className="size-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay conversaciones</p>
                  <p className="text-xs mt-2">Haz clic en el botón + para crear una nueva</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`${
                      editingChatId === chat.id && "bg-light-bg-surface dark:bg-dark-bg-surface"
                    } hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors p-2 rounded-md flex items-center justify-between group cursor-pointer`}
                    onMouseLeave={() => {
                      if (openChatOptions === chat.id) {
                        setOpenChatOptions(null);
                      }
                    }}
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
                ))
              )}
            </section>
          </>
        )}
      </main>

      <footer
        className={`${
          !isCollapsed && "border-t border-light-bg-surface dark:border-dark-bg-surface"
        } py-4 px-2`}
      >
        {!user ? (
          <div className={`space-y-2 ${isCollapsed && "hidden"}`}>
            <Link
              href="/authenticate/login"
              className="w-full flex items-center justify-center bg-secondary hover:bg-secondary/80 dark:bg-primary dark:hover:bg-primary/80 transition-colors text-white py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/authenticate/register"
              className="border border-light-text-muted dark:border-dark-text-secondary/25 hover:border-secondary hover:bg-secondary/10 hover:text-secondary dark:hover:border-primary dark:hover:bg-primary/10 dark:hover:text-primary transition-colors text-light-text-primary dark:text-dark-text-primary w-full flex py-2 items-center justify-center rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Registrarse
            </Link>
          </div>
        ) : (
          <div className={`${isCollapsed && "hidden"} flex items-center justify-between`}>
            <button
              type="button"
              onClick={handleOpenSettings}
              className="flex items-center gap-2 p-2 rounded-md text-light-text-secondary dark:text-dark-text-secondary transition-colors hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface cursor-pointer text-sm"
            >
              <MainIcons.SettingsIcon className="size-4" />
              Configuración
            </button>

            <div className="p-2">
              <ProPlanTag />
            </div>
          </div>
        )}
      </footer>

      {/* Modal de Configuración */}
      <Modal isOpen={isSettingsModalOpen} onClose={handleCloseSettings} size="3xl">
        {(onClose) => <SettingsMenu onClose={onClose} />}
      </Modal>
    </aside>
  );
}
