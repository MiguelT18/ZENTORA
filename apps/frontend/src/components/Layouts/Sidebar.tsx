import { GlobalIcons } from "@/assets/icons";
import { MainIcons } from "@/assets/icons";
import { AnimatedDropdown } from "@/components/UI/Dropdown";
import { ProPlanTag } from "@/components/UI/PlanTag";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Modal from "@/components/UI/Modal";
import SettingsMenu from "@/components/UserSettings/SettingsMenu";
import ChatCard from "@/components/UI/Sidebar/ChatCard";

export default function Sidebar() {
  const { user } = useAuth();
  const { chats, createNewChat, deleteAllChats } = useChat();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [moreMenu, setMoreMenu] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);

  const handleOpenMoreMenu = () => {
    setMoreMenu(!moreMenu);
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
            className="size-9 cursor-pointer bg-light-bg dark:bg-dark-bg border-light-bg-surface border p-2 rounded-md hover:bg-light-bg-surface/50 transition-colors dark:border-dark-bg-surface dark:hover:bg-dark-bg-surface/50 outline-none"
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
                  onClick={createNewChat}
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
                      onClick={deleteAllChats}
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
                  <ChatCard chat={chat} isCollapsed={isCollapsed} key={chat.id} />
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
