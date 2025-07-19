import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

interface DropdownMenuProps {
  children: ReactNode;
}

interface AnimatedDropdownProps extends DropdownMenuProps {
  isOpen?: boolean;
  position?: "right" | "left" | "center" | "custom";
  customClassName?: string;
  triggerRef?: React.RefObject<HTMLElement | HTMLDivElement | null>;
}

export default function DropdownMenu({
  children,
  className,
}: DropdownMenuProps & { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedDropdown({
  isOpen,
  children,
  position = "right",
  customClassName,
  triggerRef,
}: AnimatedDropdownProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [inDialog, setInDialog] = useState(false);
  const [dialogElement, setDialogElement] = useState<HTMLElement | null>(null);
  const [dropdownWidth, setDropdownWidth] = useState(0);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Detectar si el trigger está dentro de un <dialog>
  useEffect(() => {
    let foundDialog = false;
    let dialogEl = null;
    if (triggerRef?.current) {
      let el = triggerRef.current.parentElement;
      while (el && el !== document.body) {
        if (el.tagName === "DIALOG") {
          foundDialog = true;
          dialogEl = el as HTMLElement;
          break;
        }
        el = el.parentElement;
      }
    }
    setInDialog(foundDialog);
    setDialogElement(dialogEl);
  }, [triggerRef]);

  // Portal solo si NO está en un dialog
  useEffect(() => {
    if (inDialog) {
      setPortalContainer(null);
      return;
    }
    if (!portalContainer) {
      const container = document.createElement("div");
      container.id = "dropdown-portal";
      document.body.appendChild(container);
      setPortalContainer(container);
    }
    return () => {
      if (portalContainer && document.body.contains(portalContainer)) {
        document.body.removeChild(portalContainer);
      }
    };
  }, [inDialog, portalContainer]);

  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      const updatePosition = () => {
        if (triggerRef?.current) {
          const triggerRect = triggerRef.current.getBoundingClientRect();

          let left = 0;
          let top = 0;

          if (inDialog && dialogElement) {
            // Si está en un dialog, calcular posición relativa al dialog
            const dialogRect = dialogElement.getBoundingClientRect();
            left = triggerRect.left - dialogRect.left;
            top = triggerRect.bottom - dialogRect.top;
          } else {
            // Si no está en un dialog, usar posición absoluta
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            left = triggerRect.left + scrollLeft;
            top = triggerRect.bottom + scrollTop;
          }

          if (position === "right") {
            // Ajustar para que el borde derecho del dropdown coincida con el borde derecho del trigger
            let dropdownW = dropdownWidth;
            if (!dropdownW && dropdownRef.current) {
              dropdownW = dropdownRef.current.offsetWidth;
            }
            left =
              triggerRect.left +
              triggerRect.width -
              dropdownW -
              (inDialog ? dialogElement?.getBoundingClientRect().left || 0 : 0);
          } else if (position === "left") {
            left =
              triggerRect.left - (inDialog ? dialogElement?.getBoundingClientRect().left || 0 : 0);
          } else if (position === "center") {
            left =
              triggerRect.left +
              triggerRect.width / 2 -
              (inDialog ? dialogElement?.getBoundingClientRect().left || 0 : 0);
          } else if (position === "custom") {
            left =
              triggerRect.left - (inDialog ? dialogElement?.getBoundingClientRect().left || 0 : 0);
          }

          setDropdownPosition({
            top: top,
            left: left,
            width: triggerRect.width,
          });
        }
      };
      updatePosition();
      setTimeout(updatePosition, 10);
    }
  }, [isOpen, position, portalContainer, triggerRef, inDialog, dialogElement, dropdownWidth]);

  // Medir el ancho del dropdown cuando se renderiza
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      setDropdownWidth(dropdownRef.current.offsetWidth);
    }
  }, [isOpen, children]);

  let positionClass =
    "absolute bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface py-1 rounded-lg shadow-lg w-fit z-[9999]";
  if (position === "right") {
    positionClass += " left-0";
  } else if (position === "left") {
    positionClass += " right-0";
  } else if (position === "center") {
    positionClass += " left-1/2 -translate-x-1/2";
  } else if (position === "custom" && customClassName) {
    positionClass = customClassName + " " + positionClass;
  }

  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            minWidth: dropdownPosition.width,
          }}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={positionClass}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Si está en un dialog, renderiza inline, si no, usa portal
  if (inDialog) {
    return dropdownContent;
  }
  return portalContainer ? createPortal(dropdownContent, portalContainer) : null;
}
