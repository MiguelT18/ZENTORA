import { ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  children: ReactNode | ((onClose: () => void) => ReactNode);
}

export default function Modal({ isOpen, onClose, size = "md", children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
  };

  // Renderizar el contenido del modal
  const renderContent = () => {
    if (typeof children === "function") {
      return children(onClose);
    }
    return children;
  };

  return (
    <dialog
      closedby="any"
      ref={dialogRef}
      className={`backdrop:bg-black/50 backdrop:backdrop-blur-sm m-auto rounded-xl border-0 shadow-xl bg-light-bg-secondary dark:bg-dark-bg-secondary ${sizeClasses[size]} w-full max-h-[90dvh] overflow-hidden`}
    >
      {renderContent()}
    </dialog>
  );
}
