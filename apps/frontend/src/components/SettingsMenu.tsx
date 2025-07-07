import { useState } from "react";
import { GlobalIcons, MainIcons, AuthIcons } from "@/assets/icons";
import {
  GeneralSection,
  SecuritySection,
  AccountSection,
  CustomizationSection,
} from "@/components/SettingsContent";

interface SettingsModalProps {
  onClose: () => void;
}

const sectionComponents = {
  general: GeneralSection,
  security: SecuritySection,
  account: AccountSection,
  customization: CustomizationSection,
};

const sectionConfig = [
  { key: "general", label: "General", icon: MainIcons.SettingsIcon },
  { key: "security", label: "Seguridad", icon: MainIcons.ShieldIcon },
  { key: "account", label: "Cuenta", icon: AuthIcons.UserIcon },
  { key: "customization", label: "Personalización", icon: MainIcons.ColorsIcon },
] as const;

type SectionKey = (typeof sectionConfig)[number]["key"];

export default function SettingsMenu({ onClose }: SettingsModalProps) {
  const [selectedSection, setSelectedSection] = useState<SectionKey>("general");

  const SectionComponent = sectionComponents[selectedSection];

  return (
    <div className="py-4">
      <header className="px-4 pb-4 flex items-center gap-4">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MainIcons.SettingsIcon className="text-white bg-secondary dark:bg-primary size-10 p-2 rounded-md" />
            <div className="space-y-1">
              <h1 className="block text-lg text-light-text-primary dark:text-dark-text-primary font-bold">
                Configuración
              </h1>
              <span className="block text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Personaliza tu experiencia en Zentora
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Cerrar modal"
            className="p-2 rounded-md text-light-text-primary dark:text-dark-text-primary dark:bg-dark-bg-secondary cursor-pointer dark:hover:bg-dark-bg-surface dark:hover:text-dark-text-secondary hover:bg-light-bg-surface hover:text-light-text-secondary transition-colors"
          >
            <GlobalIcons.ExitIcon className="size-6" />
          </button>
        </div>
      </header>

      <main className="border-y border-light-bg-surface dark:border-dark-bg-surface grid grid-cols-[auto_1fr]">
        <aside className="border-r border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg pl-4 py-2 pr-2">
          <ul className="space-y-2">
            {sectionConfig.map(({ key, label, icon: Icon }) => (
              <li key={key}>
                <button
                  onClick={() => setSelectedSection(key)}
                  className={`flex items-center gap-2 p-2 rounded-md w-full text-sm transition-colors cursor-pointer
                    ${
                      selectedSection === key
                        ? "bg-light-bg-secondary dark:bg-dark-bg-secondary text-secondary dark:text-primary"
                        : "text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
                    }`}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="pr-4">
          <SectionComponent />
        </section>
      </main>

      <footer className="px-4 pt-4 flex items-center justify-end gap-4">
        <button
          onClick={onClose}
          className="text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors p-2 text-sm rounded-md cursor-pointer tracking-wide"
        >
          Cancelar
        </button>
        <button className="text-white bg-secondary dark:bg-primary hover:bg-secondary/80 dark:hover:bg-primary/80 transition-colors tracking-wide p-2 rounded-md text-sm cursor-pointer">
          Guardar Cambios
        </button>
      </footer>
    </div>
  );
}
