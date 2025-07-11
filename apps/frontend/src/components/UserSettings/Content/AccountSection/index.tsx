import { AuthIcons, MainIcons } from "@/assets/icons";
import { ProPlanTag } from "@/components/PlanTag";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";

interface AccountSectionProps {
  onClose: () => void;
}

export function AccountSection({ onClose }: AccountSectionProps) {
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
          href="/pricing"
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
