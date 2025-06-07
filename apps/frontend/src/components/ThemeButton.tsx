"use client";

import { ThemeIcons } from "@/assets/icons";
import { useTheme } from "@/context/ThemeContext";

export function ThemeButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 cursor-pointer border-surface border p-2 rounded-md hover:bg-surface transition-colors dark:border-surface-dark dark:hover:bg-surface-dark"
    >
      {theme === "dark" ? (
        <ThemeIcons.SunIcon className="size-5 text-text-primary dark:text-text-primary-dark" />
      ) : (
        <ThemeIcons.MoonIcon className="size-5 text-text-primary dark:text-text-primary-dark" />
      )}
    </button>
  );
}
