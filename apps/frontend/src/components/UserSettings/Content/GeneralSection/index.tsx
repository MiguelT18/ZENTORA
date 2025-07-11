import { GlobalIcons, MainIcons } from "@/assets/icons";
import { AnimatedDropdown } from "@/components/UI/Dropdown";
import SwitchButton from "@/components/UI/SwitchButton";
import { useEffect, useRef, useState } from "react";

export function GeneralSection() {
  const languages = [
    { key: "spanish", label: "Español" },
    { key: "english", label: "Inglés" },
    { key: "portuguese", label: "Portugués" },
  ];

  const [selectedLanguage, setSelectedLanguage] = useState("spanish");
  const [languageMenu, setLanguageMenu] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const selectMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectMenuRef.current && !selectMenuRef.current.contains(event.target as Node)) {
        setLanguageMenu(false);
      }
    };

    if (languageMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [languageMenu]);

  return (
    <div className="p-4">
      <h1 className="text-light-text-primary dark:text-dark-text-primary font-bold text-lg">
        Configuración General
      </h1>

      <div className="relative mt-4">
        <span className="text-light-text-primary dark:text-dark-text-primary block mb-1">
          Idioma
        </span>
        <div
          ref={selectMenuRef}
          onClick={() => setLanguageMenu(!languageMenu)}
          className="w-full max-w-[200px] p-2 rounded-md text-light-text-primary dark:text-dark-text-primary bg-light-bg dark:bg-dark-bg cursor-pointer text-sm flex items-center justify-between border border-light-bg-surface dark:border-dark-bg-surface hover:border-secondary dark:hover:border-primary transition-colors group"
        >
          {languages.find((l) => l.key === selectedLanguage)?.label}
          <GlobalIcons.TriangleArrowIcon
            className={`size-4 ${
              languageMenu ? "rotate-90" : "rotate-30"
            } transition-transform duration-300 group-hover:text-secondary dark:group-hover:text-primary`}
          />
        </div>
      </div>

      <AnimatedDropdown
        isOpen={languageMenu}
        position="custom"
        customClassName="flex flex-col"
        triggerRef={selectMenuRef}
      >
        {languages.map((lang) => (
          <button
            key={lang.key}
            className={`w-[200px] cursor-pointer text-sm p-2 text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors tracking-wide flex items-center gap-2 ${
              selectedLanguage === lang.key
                ? "text-secondary dark:text-primary bg-light-bg-secondary dark:bg-dark-bg-secondary"
                : ""
            }`}
            onClick={() => {
              setSelectedLanguage(lang.key);
              setLanguageMenu(false);
            }}
          >
            {lang.label}
          </button>
        ))}
      </AnimatedDropdown>

      <div className="mt-4">
        <h2 className="text-md font-bold flex items-center gap-2 text-light-text-primary dark:text-dark-text-primary mb-2">
          <MainIcons.AlertIcon className="size-5" />
          Notificaciones
        </h2>

        <div className="bg-light-bg-surface dark:bg-dark-bg-surface p-4 rounded-xl space-y-1 flex items-center justify-between">
          <div>
            <h3 className="block text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
              Correo Electrónico
            </h3>
            <span className="block text-xs text-light-text-secondary dark:text-dark-text-secondary">
              Recibir notificaciones por email
            </span>
          </div>

          <SwitchButton
            checked={emailNotifications}
            onChange={() => setEmailNotifications(!emailNotifications)}
          />
        </div>
      </div>
    </div>
  );
}
