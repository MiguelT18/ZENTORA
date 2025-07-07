import { AuthIcons, MainIcons, ThemeIcons } from "@/assets/icons";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";

export function GeneralSection() {
  return (
    <div className="p-4">
      <h1 className="text-light-text-primary dark:text-dark-text-primary font-bold text-lg">
        Contenido de General
      </h1>
    </div>
  );
}

export function SecuritySection() {
  return (
    <div className="p-4">
      <h1 className="text-light-text-primary dark:text-dark-text-primary font-bold text-lg">
        Contenido de Seguridad
      </h1>
    </div>
  );
}

export function AccountSection() {
  const { logout, user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

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

        <div className="space-y-2 w-full mt-2">
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
      </form>

      <div className="bg-light-bg-surface dark:bg-dark-bg-surface p-2 rounded-md mt-4">
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
            onClick={logout}
            type="button"
            className="flex items-center gap-2 bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary p-2 rounded-md hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer"
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

      <div className="bg-light-bg-surface dark:bg-dark-bg-surface p-2 rounded-md mt-4">
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
              } text-light-text-primary dark:text-dark-text-primary cursor-pointer w-full flex flex-col items-center p-2 rounded-md transition-colors`}
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
