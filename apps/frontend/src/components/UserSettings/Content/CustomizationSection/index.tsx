import { MainIcons, ThemeIcons } from "@/assets/icons";
import { useTheme } from "@/context/ThemeContext";

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
