import { AuthIcons } from "@/assets/icons";

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
