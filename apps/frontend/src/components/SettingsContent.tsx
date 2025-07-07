import { AuthIcons, GlobalIcons, MainIcons, ThemeIcons } from "@/assets/icons";
import { AnimatedDropdown } from "@/components/Dropdown";
import { ProPlanTag } from "@/components/PlanTag";
import SwitchButton from "@/components/SwitchButton";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
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

      <AnimatedDropdown isOpen={languageMenu} position="custom" customClassName="flex flex-col">
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

export function SecuritySection() {
  return (
    <div className="p-4">
      <h1 className="text-light-text-primary dark:text-dark-text-primary font-bold text-lg">
        Seguridad
      </h1>

      <form className="p-4 mt-4 bg-light-bg-surface dark:bg-dark-bg-surface rounded-xl">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-md font-bold text-light-text-primary dark:text-dark-text-primary block">
              Cambiar Contraseña
            </h2>
            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary block">
              Actualiza tu contraseña regularmente
            </span>
          </div>

          <AuthIcons.LockIcon className="size-5 text-light-text-secondary dark:text-dark-text-secondary" />
        </header>

        <div className="space-y-2">
          <input
            type="password"
            placeholder="Contraseña actual"
            className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-secondary focus:border-secondary dark:focus:ring-primary dark:focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50 hover:border-secondary/50 dark:hover:border-primary/50 transition-colors"
          />
          <input
            type="password"
            placeholder="Nueva contraseña"
            className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-secondary focus:border-secondary dark:focus:ring-primary dark:focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50 hover:border-secondary/50 dark:hover:border-primary/50 transition-colors"
          />
          <input
            type="password"
            placeholder="Confirmar nueva contraseña"
            className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-secondary focus:border-secondary dark:focus:ring-primary dark:focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50 hover:border-secondary/50 dark:hover:border-primary/50 transition-colors"
          />
        </div>

        <button className="text-sm border border-secondary dark:border-primary rounded-md py-2 w-full mt-4 text-secondary dark:text-primary hover:bg-secondary/10 dark:hover:bg-primary/10 transition-colors cursor-pointer">
          Actualizar contraseña
        </button>
      </form>
    </div>
  );
}

export function AccountSection({ onClose }: { onClose: () => void }) {
  const { logout, user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleLogout = () => {
    if (onClose) onClose();
    logout();
  };

  return (
    <div className="p-4">
      <h1 className="text-light-text-primary dark:text-dark-text-primary font-bold text-lg">
        Información de la Cuenta
      </h1>

      <form className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-2 w-full">
            <label
              htmlFor="fullName"
              className="block text-sm text-light-text-primary dark:text-dark-text-primary"
            >
              Nombre Completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-secondary focus:border-secondary dark:focus:ring-primary dark:focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50 hover:border-secondary/50 dark:hover:border-primary/50 transition-colors"
            />
          </div>

          <div className="space-y-2 w-full">
            <label
              htmlFor="email"
              className="block text-sm text-light-text-primary dark:text-dark-text-primary"
            >
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-secondary focus:border-secondary dark:focus:ring-primary dark:focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50 hover:border-secondary/50 dark:hover:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div className="w-full mt-2">
          <div className="space-y-2">
            <label
              htmlFor="bio"
              className="block text-sm text-light-text-primary dark:text-dark-text-primary"
            >
              Biografía para Nexa AI
            </label>
            <textarea
              rows={5}
              name="bio"
              placeholder="Trader experimentado con 5 años en..."
              className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-secondary focus:border-secondary dark:focus:ring-primary dark:focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50 hover:border-secondary/50 dark:hover:border-primary/50 transition-colors resize-none"
            ></textarea>
          </div>
          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2 block">
            Esta información ayuda a Nexa a entender tu perfil y proporcionar respuestas más
            personalizadas.
          </span>
        </div>
      </form>

      <div className="bg-light-bg-surface dark:bg-dark-bg-surface p-4 rounded-xl mt-4 flex flex-col sm:flex-row items-center justify-between border border-light-bg-secondary dark:border-dark-bg-secondary">
        <div className="space-y-2">
          <span className="block text-sm text-light-text-primary dark:text-dark-text-primary">
            Plan actual
          </span>
          <ProPlanTag />
        </div>
        <Link
          href="/pricing
          "
          className="text-secondary dark:text-primary px-4 py-2 rounded-md text-xs font-semibold border border-secondary dark:border-primary hover:bg-secondary/10 dark:hover:bg-primary/10 transition-colors"
        >
          Gestionar plan
        </Link>
      </div>

      <div className="bg-light-bg-surface dark:bg-dark-bg-surface p-4 rounded-xl mt-4">
        <h2 className="text-sm font-bold flex items-center gap-2 text-light-text-primary dark:text-dark-text-primary">
          <MainIcons.UserCheckIcon className="size-5" />
          Gestión de Sesión
        </h2>

        <div className="flex items-center justify-between mt-4">
          <div>
            <h3 className="font-bold text-sm text-light-text-primary dark:text-dark-text-primary">
              Cerrar Sesión
            </h3>
            <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              Terminar tu sesión actual en este dispositivo
            </span>
          </div>

          <button
            onClick={handleLogout}
            type="button"
            className="flex items-center gap-2 bg-error hover:bg-error/80 text-white p-2 rounded-md transition-colors cursor-pointer text-xs"
          >
            <AuthIcons.LogoutIcon className="size-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export function CustomizationSection() {
  const themes = [
    { key: "light", label: "Claro", icon: ThemeIcons.SunIcon },
    { key: "dark", label: "Oscuro", icon: ThemeIcons.MoonIcon },
    { key: "system", label: "Sistema", icon: ThemeIcons.SystemIcon },
  ] as const;

  const { theme: selectedTheme, setTheme } = useTheme();

  return (
    <div className="p-4">
      <h1 className="text-light-text-primary dark:text-dark-text-primary font-bold text-lg">
        Personalización
      </h1>

      <div className="bg-light-bg-surface dark:bg-dark-bg-surface p-4 rounded-xl mt-4">
        <h2 className="text-sm font-bold flex items-center gap-2 text-light-text-primary dark:text-dark-text-primary">
          <MainIcons.ColorsIcon className="size-5" />
          Tema de la aplicación
        </h2>

        <ul className="flex items-center justify-between gap-2 mt-4">
          {themes.map(({ key, label, icon: Icon }) => (
            <li
              onClick={() => setTheme(key)}
              key={key}
              className={`${
                selectedTheme === key
                  ? "border-2 border-secondary dark:border-primary text-secondary dark:text-primary"
                  : "hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
              } text-light-text-primary dark:text-dark-text-primary cursor-pointer w-full flex flex-col items-center py-4 rounded-md transition-colors`}
            >
              <Icon className="size-6" />
              <span className="text-sm">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
