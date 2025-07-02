"use client";

import { AnimatePresence } from "framer-motion";
import { useNotification } from "@/context/NotificationContext";
import { NotificationToast } from "./NotificationToast";
import { useEffect, useState } from "react";

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return (
    <div className="w-max fixed max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:top-4 bottom-4 right-4 z-50 flex flex-col gap-2">
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
