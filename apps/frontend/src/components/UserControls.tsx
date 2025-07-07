"use client";

import { GlobalIcons, ThemeIcons } from "@/assets/icons";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

export function UserControls() {
  const { currentTheme, toggleTheme } = useTheme();

  return (
    <div className="flex gap-2 items-center absolute z-10 top-4 right-4 max-sm:top-2 max-sm:right-2">
      <Link
        href="/"
        className="backdrop-blur-md shadow-sm cursor-pointer border-light-bg-surface border p-2 rounded-md hover:bg-light-bg-surface/50 transition-colors dark:border-dark-bg-surface dark:hover:bg-dark-bg-surface/50"
      >
        <GlobalIcons.HomeIcon className="size-5 text-text-primary dark:text-text-primary-dark" />
      </Link>

      <button
        onClick={toggleTheme}
        className="backdrop-blur-md shadow-sm cursor-pointer border-light-bg-surface border p-2 rounded-md hover:bg-light-bg-surface/50 transition-colors dark:border-dark-bg-surface dark:hover:bg-dark-bg-surface/50"
      >
        {currentTheme === "dark" ? (
          <ThemeIcons.SunIcon className="size-5 text-text-primary dark:text-text-primary-dark" />
        ) : (
          <ThemeIcons.MoonIcon className="size-5 text-text-primary dark:text-text-primary-dark" />
        )}
      </button>
    </div>
  );
}
