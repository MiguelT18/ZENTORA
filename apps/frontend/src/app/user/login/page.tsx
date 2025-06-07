"use client";

import Link from "next/link";
import { AuthIcons } from "@/assets/icons";
import { useState } from "react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh max-sm:px-4">
      <article className="w-full max-w-md bg-white dark:bg-surface-dark p-8 max-sm:mt-4 max-sm:p-4 rounded-lg shadow-md border border-surface dark:border-surface-dark">
        <header className="mb-6 text-center">
          <h1 className="text-xl font-bold mb-2">Iniciar Sesión</h1>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Ingresa tus credenciales para acceder a tu cuenta</p>
        </header>

        <section>
          <form>
            <div className="mb-2">
              <label htmlFor="email" className="block mb-2 font-medium text-sm">Correo electrónico</label>
              <div className="relative">
                <AuthIcons.MailIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary dark:text-text-secondary-dark" />
                <input type="email" id="email" placeholder="Tu correo electrónico" className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-background dark:ring-offset-background-dark file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-8 border-surface dark:border-surface-dark bg-background dark:bg-background-dark text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary" />
              </div>
            </div>

            <div className="mb-2">
              <label htmlFor="password" className="block mb-2 font-medium text-sm">Contraseña</label>
              <div className="relative">
                <AuthIcons.LockIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary dark:text-text-secondary-dark" />
                <input type={showPassword ? "text" : "password"} id="password" placeholder="Tu contraseña" className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-background dark:ring-offset-background-dark file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-8 border-surface dark:border-surface-dark bg-background dark:bg-background-dark text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors">
                  {showPassword ? <AuthIcons.EyeOffIcon className="size-4" /> : <AuthIcons.EyeIcon className="size-4" />}
                </button>
              </div>
            </div>

            <span className="text-info text-sm block cursor-pointer hover:underline transition-colors">¿Olvidaste tu contraseña?</span>

            <button className="w-full bg-primary hover:bg-primary/80 transition-colors text-white py-2 rounded-md mt-4 cursor-pointer">Iniciar Sesión</button>
          </form>
        </section>

        <footer className="mt-4">
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark text-center">O continúa con</p>

          <div className="flex gap-2 justify-center [&>button]:flex [&>button]:items-center [&>button]:gap-2 [&>button]:bg-background [&>button]:border [&>button]:border-surface [&>button]:dark:bg-background-dark [&>button]:dark:border-surface-dark [&>button]:text-text-primary [&>button]:dark:text-text-primary-dark [&>button]:px-4 [&>button]:py-2 [&>button]:rounded-md [&>button]:mt-2 [&>button]:cursor-pointer">
            <button type="button" className="hover:bg-surface/80 dark:hover:bg-background-dark/50 transition-colors">
              <AuthIcons.GithubIcon className="size-5" />
              GitHub
            </button>
            <button type="button" className="hover:bg-surface/80 dark:hover:bg-background-dark/50 transition-colors">
              <AuthIcons.GoogleIcon className="size-5" />
              Google
            </button>
          </div>

          <p className="text-sm text-center mt-4">¿No tienes una cuenta? <Link href="/user/register" className="text-primary hover:text-primary/80 transition-colors hover:underline ml-1">Regístrate aquí</Link></p>
        </footer>
      </article>
    </main>
  );
}
