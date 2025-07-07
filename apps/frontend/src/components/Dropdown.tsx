import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface DropdownMenuProps {
  children: ReactNode;
}

interface AnimatedDropdownProps extends DropdownMenuProps {
  isOpen?: boolean;
  position?: "right" | "left" | "center" | "custom";
  customClassName?: string;
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
}: AnimatedDropdownProps) {
  let positionClass =
    "absolute mt-1 w-max bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface py-1 rounded-lg shadow-lg z-10";
  if (position === "right") positionClass = "absolute right-0 top-full " + positionClass;
  else if (position === "left") positionClass = "absolute left-0 top-full " + positionClass;
  else if (position === "center")
    positionClass = "absolute left-1/2 -translate-x-1/2 top-full " + positionClass;
  else if (position === "custom" && customClassName)
    positionClass = customClassName + " " + positionClass;

  return (
    <AnimatePresence>
      {isOpen && <DropdownMenu className={positionClass}>{children}</DropdownMenu>}
    </AnimatePresence>
  );
}
