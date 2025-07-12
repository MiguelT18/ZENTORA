import { MainIcons } from "@/assets/icons";
import type { view } from "@/utils/types";
import { motion } from "framer-motion";
import React, { useState, useRef, useEffect } from "react";
import ChatMessage from "@/components/UI/ChatMessage";
import ChatSuggestions from "@/components/UI/ChatSuggestions";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";

export default function AIChat({ view }: { view: view }) {
  const { currentChat, createNewChat, addMessageToCurrentChat, addMessageToChat, chats } =
    useChat();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [textareaHeight, setTextareaHeight] = useState(40);
  const [isTyping, setIsTyping] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const simulateAssistantResponse = async (userMessage: string, chatId?: string) => {
    setIsTyping(true);

    console.log(userMessage);

    // Simular delay de respuesta
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    const responses = [
      "Entiendo tu pregunta sobre el mercado. Basándome en los datos actuales, puedo ver que hay algunas tendencias interesantes que vale la pena analizar.",
      "Excelente pregunta. El análisis de mercado actual muestra patrones que sugieren oportunidades interesantes para inversores.",
      "Gracias por tu consulta. Los indicadores del mercado muestran una situación dinámica que requiere atención cuidadosa.",
      "Interesante perspectiva. Los datos recientes indican cambios significativos en el panorama financiero.",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Si se proporciona un chatId específico, usarlo
    if (chatId) {
      addMessageToChat(chatId, {
        content: randomResponse,
        role: "assistant",
      });
    } else if (currentChat) {
      addMessageToCurrentChat({
        content: randomResponse,
        role: "assistant",
      });
    } else {
      // Fallback: usar el chat más reciente
      const latestChat = chats[chats.length - 1];
      if (latestChat) {
        addMessageToChat(latestChat.id, {
          content: randomResponse,
          role: "assistant",
        });
      }
    }

    setIsTyping(false);
  };

  const handleSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = message.trim();
    if (trimmed === "") return;

    // Si no hay chat actual, crear uno nuevo
    if (!currentChat) {
      const newChatId = createNewChat();
      // Agregar el mensaje directamente al chat creado
      addMessageToChat(newChatId, {
        content: trimmed,
        role: "user",
      });
      setMessage("");
      // Simular respuesta del asistente con el ID del chat creado
      simulateAssistantResponse(trimmed, newChatId);
      return;
    }

    addMessageToCurrentChat({
      content: trimmed,
      role: "user",
    });
    setMessage("");

    // Simular respuesta del asistente
    simulateAssistantResponse(trimmed);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(scrollHeight, 120);
      setTextareaHeight(newHeight);
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // Si el usuario no está autenticado, mostrar mensaje de inicio de sesión
  if (!user) {
    return (
      <aside
        className={`${
          view === "chat" ? "block" : "hidden"
        } inset-0 lg:static lg:grid grid-rows-[auto_1fr_auto] h-dvh lg:h-full flex flex-col bg-light-bg-secondary dark:bg-dark-bg-secondary`}
      >
        <header className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-bl from-primary to-secondary p-2 rounded-md">
                <MainIcons.RobotIcon className="size-5 text-white" />
              </div>

              <div>
                <h2 className="block text-lg text-light-text-primary dark:text-dark-text-primary font-bold">
                  Nexa
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`block size-2 rounded-full ${!user ? "bg-warning" : "bg-success"}`}
                  />
                  <span className="text-light-text-secondary dark:text-dark-text-secondary text-xs">
                    Requiere autenticación
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto px-4 flex items-center justify-center">
          <div className="text-center space-y-2 max-w-md">
            <div className="bg-gradient-to-bl from-primary to-secondary p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <MainIcons.RobotIcon className="size-8 text-white" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                Acceso requerido
              </h3>
              <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">
                Para interactuar con Nexa y acceder a análisis personalizados, necesitas iniciar
                sesión o crear una cuenta.
              </p>
            </div>
          </div>
        </main>

        <footer className="px-4 pt-4 mt-auto max-lg:pb-14">
          <span className="text-light-text-secondary dark:text-dark-text-secondary text-xs text-pretty text-center flex items-center justify-center gap-2 my-2">
            <MainIcons.AIIcon className="size-4 max-sm:hidden" />
            Nexa proporciona análisis, no consejos financieros
          </span>
        </footer>
      </aside>
    );
  }

  return (
    <aside
      className={`${
        view === "chat" ? "block" : "hidden"
      } inset-0 lg:static lg:grid grid-rows-[auto_1fr_auto] h-dvh lg:h-full flex flex-col bg-light-bg-secondary dark:bg-dark-bg-secondary overflow-y-hidden`}
    >
      <header className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-bl from-primary to-secondary p-2 rounded-md">
              <MainIcons.RobotIcon className="size-5 text-white" />
            </div>

            <div>
              <h2 className="block text-lg text-light-text-primary dark:text-dark-text-primary font-bold">
                Nexa
              </h2>
              <div className="flex items-center gap-2">
                <span className="block size-2 rounded-full bg-success" />
                <span className="text-light-text-secondary dark:text-dark-text-secondary text-xs">
                  Disponible
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={createNewChat}
            title="Crear nueva conversación"
            aria-label="Crear nueva conversación"
            className="size-9 cursor-pointer bg-light-bg dark:bg-dark-bg border-light-bg-surface border p-2 rounded-md hover:bg-light-bg-surface/50 transition-colors dark:border-dark-bg-surface dark:hover:bg-dark-bg-surface/50"
          >
            <MainIcons.PlusIcon className="size-full" />
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-4">
        {!currentChat || currentChat.messages.length === 0 ? (
          <ChatSuggestions onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="flex flex-col">
            {currentChat.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isTyping && (
              <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 justify-start">
                <div className="bg-gradient-to-bl from-primary to-secondary p-1.5 sm:p-2 rounded-md flex-shrink-0">
                  <MainIcons.RobotIcon className="size-4 sm:size-5 text-white" />
                </div>
                <div className="bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface rounded-lg px-3 py-2 sm:px-4 sm:py-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-light-text-secondary dark:text-dark-text-secondary rounded-full animate-bounce" />
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-light-text-secondary dark:text-dark-text-secondary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-light-text-secondary dark:text-dark-text-secondary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="px-4 pt-4 mt-auto max-lg:pb-14">
        <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
          <motion.textarea
            rows={1}
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe algo..."
            style={{ height: textareaHeight }}
            animate={{ height: textareaHeight }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-secondary focus:border-secondary dark:focus:ring-primary dark:focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50 hover:border-secondary/50 dark:hover:border-primary/50 transition-colors resize-none min-h-[40px] overflow-y-auto"
          />

          <div className="group">
            <button
              type="submit"
              disabled={isTyping || message.trim() === ""}
              className="cursor-pointer w-10 h-10 rounded-full bg-secondary dark:bg-primary flex items-center justify-center overflow-hidden aspect-square group-hover:bg-secondary/80 dark:group-hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MainIcons.SendIcon className="w-4 h-4 text-white block" />
            </button>
          </div>
        </form>

        <span className="text-light-text-secondary dark:text-dark-text-secondary text-xs text-pretty text-center flex items-center justify-center gap-2 my-2">
          <MainIcons.AIIcon className="size-4 max-sm:hidden" />
          Nexa proporciona análisis, no consejos financieros
        </span>
      </footer>
    </aside>
  );
}
