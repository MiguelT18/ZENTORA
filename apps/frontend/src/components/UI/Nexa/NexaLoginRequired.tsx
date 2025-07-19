import { MainIcons } from "@/assets/icons";
import type { User, view } from "@/utils/types";

interface NexaLoginRequiredProps {
  view: view;
  user: User | null;
}

export default function NexaLoginRequired(props: NexaLoginRequiredProps) {
  const { view, user } = props;

  return (
    <aside
      className={`${
        view === "chat" ? "block" : "hidden"
      } inset-0 lg:static lg:grid grid-rows-[auto_1fr_auto] h-dvh lg:h-full flex flex-col bg-light-bg-secondary dark:bg-dark-bg-secondary`}
    >
      <header className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-bl from-primary to-secondary p-2 rounded-md">
              <MainIcons.RobotIcon className="size-5 text-white" />
            </div>

            <div>
              <h2 className="block text-lg text-light-text-primary dark:text-dark-text-primary font-bold">
                Nexa
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className={`block size-2 rounded-full ${!user ? "bg-warning" : "bg-success"}`}
                />
                <span className="text-light-text-secondary dark:text-dark-text-secondary text-xs">
                  Requiere autenticación
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-4 flex items-center justify-center">
        <div className="text-center space-y-2 max-w-md">
          <div className="bg-gradient-to-bl from-primary to-secondary p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <MainIcons.RobotIcon className="size-8 text-white" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
              Acceso requerido
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">
              Para interactuar con Nexa y acceder a análisis personalizados, necesitas iniciar
              sesión o crear una cuenta.
            </p>
          </div>
        </div>
      </main>

      <footer className="px-4 pt-4 mt-auto max-lg:pb-14">
        <span className="text-light-text-secondary dark:text-dark-text-secondary text-xs text-pretty text-center flex items-center justify-center gap-2 my-2">
          <MainIcons.AIIcon className="size-4 max-sm:hidden" />
          Nexa proporciona análisis, no consejos financieros
        </span>
      </footer>
    </aside>
  );
}
