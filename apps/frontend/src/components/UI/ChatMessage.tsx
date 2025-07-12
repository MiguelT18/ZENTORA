import React from "react";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 sm:gap-3 p-2 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] sm:max-w-[80%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-lg px-4 py-3 relative group ${
            isUser
              ? "bg-secondary dark:bg-primary/80 text-white"
              : "bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface"
          }`}
        >
          <p className="text-sm text-pretty whitespace-pre-wrap pr-8">{message.content}</p>

          <p
            className={`absolute bottom-1 right-2 text-xs opacity-60 ${
              isUser ? "text-white/80" : "text-light-text-secondary dark:text-dark-text-secondary"
            }`}
          >
            {message.timestamp.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
