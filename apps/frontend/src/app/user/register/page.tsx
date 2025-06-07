"use client";

import Link from "next/link";
import { AuthIcons } from "@/assets/icons";
import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useNotification } from "@/context/NotificationContext";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { addNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, getValues } = useForm({
    defaultValues: {
      name: "",
      lastname: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      const dataToSend = {
        full_name: `${data.name} ${data.lastname}`,
        email: data.email,
        password: data.password,
      };

      const response = await axios.post("/api/v1/auth/register", dataToSend);
      addNotification("success", response.data.message);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Ha ocurrido un error al crear la cuenta";
      addNotification("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh max-sm:px-4">
      <article className="w-full max-w-md bg-white dark:bg-surface-dark p-8 max-sm:mt-4 max-sm:p-4 rounded-lg shadow-md border border-surface dark:border-surface-dark">
        <header className="mb-6 text-center">
          <h1 className="text-xl font-bold mb-2">Crear Cuenta</h1>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Completa los datos para crear tu nueva cuenta</p>
        </header>

        <section>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <label htmlFor="name" className="block mb-2 font-medium text-sm">Nombres</label>
                <div className="flex flex-col gap-1">
                  <div className="relative">
                    <AuthIcons.UserIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary dark:text-text-secondary-dark" />
                    <input
                      {...register("name", {
                        required: {
                          value: true,
                          message: "El nombre es requerido",
                        },
                        minLength: {
                          value: 3,
                          message: "El nombre debe tener al menos 3 caracteres",
                        },
                        pattern: {
                          value: /^\p{L}+(?:[\s\-']\p{L}+)*$/u,
                          message: "El nombre solo puede contener letras",
                        },
                      })}
                      type="text"
                      id="name"
                      placeholder="Tus nombres"
                      className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-background dark:ring-offset-background-dark file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-8 border-surface dark:border-surface-dark bg-background dark:bg-background-dark text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
                    />
                  </div>
                  {errors.name && <p className="text-error text-xs mt-0.5">{errors.name.message}</p>}
                </div>
              </div>

              <div className="flex-1">
                <label htmlFor="lastname" className="block mb-2 font-medium text-sm">Apellidos</label>
                <div className="flex flex-col gap-1">
                  <div className="relative">
                    <AuthIcons.UserIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary dark:text-text-secondary-dark" />
                    <input
                      {...register("lastname", {
                        required: {
                          value: true,
                          message: "El apellido es requerido",
                        },
                        minLength: {
                          value: 3,
                          message: "El apellido debe tener al menos 3 caracteres",
                        },
                        pattern: {
                          value: /^\p{L}+(?:[\s\-']\p{L}+)*$/u,
                          message: "El apellido solo puede contener letras",
                        },
                      })}
                      type="text"
                      id="lastname"
                      placeholder="Tus apellidos"
                      className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-background dark:ring-offset-background-dark file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-8 border-surface dark:border-surface-dark bg-background dark:bg-background-dark text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
                    />
                  </div>
                  {errors.lastname && <p className="text-error text-xs mt-0.5">{errors.lastname.message}</p>}
                </div>
              </div>
            </div>

            <div className="mb-2">
              <label htmlFor="email" className="block mb-2 font-medium text-sm">Correo electrónico</label>
              <div className="relative">
                <AuthIcons.MailIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary dark:text-text-secondary-dark" />
                <input
                  {...register("email", {
                    required: {
                      value: true,
                      message: "El correo electrónico es requerido",
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
                      message: "El correo electrónico no es válido",
                    },
                  })}
                  type="email"
                  id="email"
                  placeholder="Tu correo electrónico"
                  className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-background dark:ring-offset-background-dark file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-8 border-surface dark:border-surface-dark bg-background dark:bg-background-dark text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
                />
              </div>
              {errors.email && <p className="text-error text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div className="mb-2">
              <label htmlFor="password" className="block mb-2 font-medium text-sm">Contraseña</label>
              <div className="relative">
                <AuthIcons.LockIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary dark:text-text-secondary-dark" />
                <input
                  {...register("password", {
                    required: {
                      value: true,
                      message: "La contraseña es requerida",
                    },
                    minLength: {
                      value: 8,
                      message: "La contraseña debe tener al menos 8 caracteres",
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
                      message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial",
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Tu contraseña segura"
                  className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-background dark:ring-offset-background-dark file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-8 pr-8 border-surface dark:border-surface-dark bg-background dark:bg-background-dark text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors">
                  {showPassword ? <AuthIcons.EyeOffIcon className="size-4" /> : <AuthIcons.EyeIcon className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-error text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <div className="mb-2">
              <label htmlFor="confirm-password" className="block mb-2 font-medium text-sm">Confirmar contraseña</label>
              <div className="relative">
                <AuthIcons.LockIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary dark:text-text-secondary-dark" />
                <input
                  {...register("confirmPassword", {
                    required: {
                      value: true,
                      message: "La confirmación de la contraseña es requerida",
                    },
                    validate: {
                      matchPassword: (value) => value === getValues("password") || "Las contraseñas no coinciden"
                    },
                  })}
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password"
                  placeholder="Confirma tu contraseña"
                  className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-background dark:ring-offset-background-dark file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-8 pr-8 border-surface dark:border-surface-dark bg-background dark:bg-background-dark text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors">
                  {showConfirmPassword ? <AuthIcons.EyeOffIcon className="size-4" /> : <AuthIcons.EyeIcon className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-error text-xs mt-1.5">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary/80 transition-colors text-white py-2 rounded-md mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear cuenta"}
            </button>
          </form>
        </section>

        <footer className="mt-4">
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark text-center">O regístrate con</p>

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

          <p className="text-sm text-center mt-4">¿Ya tienes una cuenta? <Link href="/user/login" className="text-primary hover:text-primary/80 transition-colors hover:underline ml-1">Inicia sesión aquí</Link></p>
        </footer>
      </article>
    </main>
  );
}
