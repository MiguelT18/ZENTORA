"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { GlobalIcons } from "@/assets/icons";

interface NotificationToastProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  onRemove: (id: string) => void;
}

const toastTypeStyles = {
  success: "bg-success/20 border-success/50 text-success",
  error: "bg-error/20 border-error/50 text-error",
  warning: "bg-warning/20 border-warning/50 text-warning",
  info: "bg-info/20 border-info/50 text-info",
};

export function NotificationToast({ id, type, message, onRemove }: NotificationToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`flex items-center justify-between gap-2 px-4 py-2 rounded-lg border ${toastTypeStyles[type]} shadow-lg w-full max-w-xs sm:max-w-md break-words backdrop-blur-sm`}
      style={{ wordBreak: "break-word" }}
    >
      <button
        onClick={() => onRemove(id)}
        className="ml-auto hover:opacity-70 transition-opacity cursor-pointer"
      >
        <GlobalIcons.ExitIcon className="size-4" />
      </button>

      <span
        className="text-sm font-medium break-words whitespace-pre-line max-w-[70vw] sm:max-w-xs"
        style={{ wordBreak: "break-word" }}
      >
        {message}
      </span>
    </motion.div>
  );
}
