import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface DropdownMenuProps {
  children: ReactNode;
}

interface AnimatedDropdownProps extends DropdownMenuProps {
  isOpen?: boolean;
}

export default function DropdownMenu({ children }: DropdownMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute right-0 top-full mt-1 w-max bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface py-1 rounded-lg shadow-lg z-10"
    >
      {children}
    </motion.div>
  );
}

export function AnimatedDropdown({ isOpen, children }: AnimatedDropdownProps) {
  return <AnimatePresence>{isOpen && <DropdownMenu>{children}</DropdownMenu>}</AnimatePresence>;
}
