"use client";

import { AnimatePresence } from "framer-motion";
import { useNotification } from "@/context/NotificationContext";
import { NotificationToast } from "./NotificationToast";

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-4 md:right-auto z-50 flex flex-col gap-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            id={notification.id}
            type={notification.type}
            message={notification.message}
            onRemove={removeNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
