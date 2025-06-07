"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

interface NotificationToastProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  onRemove: (id: string) => void;
}

const toastTypeStyles = {
  success: "bg-success/15 border-success/50 text-success",
  error: "bg-error/15 border-error/50 text-error",
  warning: "bg-warning/15 border-warning/50 text-warning",
  info: "bg-info/15 border-info/50 text-info",
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
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${toastTypeStyles[type]} shadow-lg w-full md:w-auto md:min-w-[320px] md:max-w-md`}
    >
      <span className="text-sm font-medium">{message}</span>

      <button
        onClick={() => onRemove(id)}
        className="ml-auto hover:opacity-70 transition-opacity cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </motion.div>
  );
}
