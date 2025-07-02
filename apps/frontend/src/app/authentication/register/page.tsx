"use client";

import Link from "next/link";
import { AuthIcons, GlobalIcons } from "@/assets/icons";
import {
  useRef,
  useState,
  ChangeEvent,
  KeyboardEvent,
  ClipboardEvent,
  useEffect,
  useCallback,
} from "react";
import { useForm } from "react-hook-form";
import axios, { AxiosError } from "axios";
import { useNotification } from "@/context/NotificationContext";
import { UserControls } from "@/components/UserControls";
import ModalNotification from "@/components/Notification/ModalNotification";
import { PublicRoute } from "@/components/PublicRoute";

import type { ModalNotification as ModalNotificationType, User as UserType } from "@/utils/types";

interface RegisterFormData {
  name: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [loading, setLoading] = useState<null | "register" | "verify" | "resend">(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [shouldVerify, setShouldVerify] = useState<boolean>(false);
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [modalNotification, setModalNotification] = useState<ModalNotificationType | null>(null);
  const [user, setUser] = useState<UserType | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { addNotification } = useNotification();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    defaultValues: {
      name: "",
      lastname: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const handleGithubLogin = () => {
    axios.get("/api/v1/auth/github/login").then((res) => {
      window.location.href = res.data.authorization_url;
    });
  };

  const handleGoogleLogin = () => {
    axios.get("/api/v1/auth/google/login").then((res) => {
      window.location.href = res.data.authorization_url;
    });
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Mover al siguiente input si hay un valor
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Mover al input anterior al presionar backspace en un input vacío
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    // Distribuir cada dígito en su respectivo input
    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newCode[i] = pastedData[i];
      }
    }
    setCode(newCode);

    // Enfocar el último input con valor
    const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
    if (lastFilledIndex >= 0 && lastFilledIndex < 6) {
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    const verifyAccountModal = document.getElementById("verify-account-modal") as HTMLDialogElement;

    try {
      setLoading("register");
      const dataToSend = {
        full_name: `${data.name} ${data.lastname}`,
        email: data.email,
        password: data.password,
      };

      const res = await axios.post("/api/v1/auth/register", dataToSend, {
        withCredentials: true,
      });

      if (res.status === 201) {
        localStorage.setItem("email", data.email);
        setModalNotification({ message: res.data.message, type: "success" });
        setUser(res.data.user);
        verifyAccountModal.showModal();
      }
    } catch (e) {
      const error = e as AxiosError<{ detail: string }>;
      addNotification(
        "error",
        error.response?.data?.detail || "Ha ocurrido un error al crear la cuenta"
      );
      setUser(null);
    } finally {
      setTimeout(() => {
        setModalNotification(null);
      }, 5000);
      setLoading(null);
    }
  };

  const verifyCode = useCallback(async () => {
    const verifyAccountModal = document.getElementById("verify-account-modal") as HTMLDialogElement;

    const joinedCode = code.join("");

    try {
      setLoading("verify");
      const res = await axios.post(`/api/v1/auth/verify-email/${joinedCode}`);

      if (res.status === 200) {
        setModalNotification({
          message: res.data.message,
          type: "success",
        });
        localStorage.removeItem("email");
        localStorage.setItem("success_login_message", res.data.message);
        verifyAccountModal.close();
        window.location.replace("/");
      }
    } catch (e) {
      const error = e as AxiosError<{ detail: string }>;
      setModalNotification({
        message: error.response?.data?.detail || "Ha ocurrido un error al verificar el código",
        type: "error",
      });
    } finally {
      setTimeout(() => setModalNotification(null), 5000);
      setLoading(null);
    }
  }, [code]);

  const resendCode = async () => {
    setLoading("resend");
    try {
      const email = localStorage.getItem("email");
      if (!email) {
        setModalNotification({
          type: "error",
          message: "No se encontró el correo electrónico",
        });
        return;
      }

      const res = await axios.post("/api/v1/auth/resend-verification", {
        email,
      });

      if (res.status === 200) {
        setModalNotification({
          type: "success",
          message: res.data.message,
        });
      }
    } catch (e) {
      const error = e as AxiosError<{ detail: string }>;
      setModalNotification({
        message: error.response?.data?.detail || "Ha ocurrido un error al reenviar el código",
        type: "error",
      });
    } finally {
      setLoading(null);
      setTimeout(() => setModalNotification(null), 5000);
    }
  };

  useEffect(() => {
    const isComplete = code.every((digit) => digit !== "");

    if (isComplete && user) setShouldVerify(true);
  }, [code, user]);

  useEffect(() => {
    if (shouldVerify) {
      verifyCode();
      setShouldVerify(false);
    }
  }, [shouldVerify, verifyCode]);

  return (
    <PublicRoute>
      <dialog
        id="verify-account-modal"
        className="w-full max-w-md m-auto bg-light-bg-secondary dark:bg-dark-bg-surface p-8 max-sm:p-4 rounded-lg shadow-md border border-light-bg-surface dark:border-dark-bg-surface backdrop:backdrop-blur-sm max-sm:w-[90%] outline-none"
      >
        <header>
          <span className="block size-fit rounded-full bg-secondary/10 dark:bg-primary/10 p-3 mx-auto mb-2">
            <GlobalIcons.AnimatedEmailIcon className="size-8 text-secondary dark:text-primary mx-auto" />
          </span>

          <h1 className="text-xl font-bold mb-2 text-center text-light-text-primary dark:text-dark-text-primary">
            Verificar Cuenta
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center">
            Hemos enviado un código de 6 dígitos a
            <span className="text-light-text-secondary dark:text-dark-text-secondary text-sm font-bold block">
              {user?.email ||
                (typeof window !== "undefined"
                  ? localStorage.getItem("email")
                  : "correo@ejemplo.com")}
            </span>
          </p>
        </header>

        <section className="mt-6">
          {modalNotification && (
            <ModalNotification message={modalNotification.message} type={modalNotification.type} />
          )}

          <div className="flex justify-center gap-2 mt-4">
            {Array(6)
              .fill(null)
              .map((_, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={code[index]}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleChange(index, e.target.value)
                  }
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-9 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border rounded-lg bg-light-bg dark:bg-dark-bg dark:text-dark-text-primary text-light-text-primary focus:border-secondary dark:focus:border-primary focus:ring-2 focus:ring-secondary/20 dark:focus:ring-primary/20 focus:outline-none transition-all duration-200 hover:border-secondary/50 dark:hover:border-primary/50 border-light-bg-surface dark:border-dark-bg-surface"
                />
              ))}
          </div>

          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center mt-2">
            Ingresa el código de 6 dígitos o pégalo desde tu correo
          </p>

          <button
            onClick={verifyCode}
            className="w-full bg-secondary hover:bg-secondary/80 dark:bg-primary dark:hover:bg-primary/80 transition-colors text-white py-2 rounded-md mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={code.some((digit) => !digit) || loading === "verify"}
          >
            {loading === "verify" ? "Verificando..." : "Verificar Código"}
          </button>
        </section>

        <footer className="mt-4 flex flex-col items-center">
          <p className="block text-sm text-light-text-secondary dark:text-dark-text-secondary text-center">
            ¿No recibiste el código?
          </p>

          <button
            onClick={resendCode}
            className="bg-background dark:bg-background-dark transition-colors text-secondary dark:text-primary px-4 py-2 rounded-md mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-fit flex items-center border border-border dark:border-border-dark hover:bg-secondary/10 dark:hover:bg-primary/10 mx-auto"
            disabled={loading === "resend"}
          >
            <GlobalIcons.RestartIcon className="size-4 mr-2 text-secondary dark:text-primary" />
            {loading === "resend" ? "Reenviando..." : "Reenviar Código"}
          </button>

          <Link
            href="/authentication/login"
            className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary text-center mt-4 hover:text-secondary dark:hover:text-primary transition-colors cursor-pointer"
          >
            <GlobalIcons.ArrowIcon className="size-4 rotate-180" />
            Volver al inicio de sesión
          </Link>
        </footer>
      </dialog>

      <main className="flex flex-col items-center justify-center min-h-dvh max-sm:px-4">
        <UserControls />

        <article className="w-full max-w-md bg-light-bg-secondary dark:bg-dark-bg-secondary p-8 max-sm:mt-4 max-sm:p-4 rounded-lg shadow-md border border-light-bg-surface dark:border-dark-bg-surface">
          <header className="mb-6 text-center space-y-1">
            <h1 className="text-xl font-bold">Crear Cuenta</h1>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Completa los datos para crear tu nueva cuenta
            </p>
          </header>

          <section>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <label htmlFor="name" className="block mb-2 font-medium text-sm">
                    Nombres
                  </label>
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
                        autoComplete="off"
                        type="text"
                        id="name"
                        placeholder="John"
                        className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed pl-8 border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-primary focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-error text-xs mt-0.5">{errors.name.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <label htmlFor="lastname" className="block mb-2 font-medium text-sm">
                    Apellidos
                  </label>
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
                        autoComplete="off"
                        placeholder="Doe Smith"
                        className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed pl-8 border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-primary focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50"
                      />
                    </div>
                    {errors.lastname && (
                      <p className="text-error text-xs mt-0.5">{errors.lastname.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <label htmlFor="email" className="block mb-2 font-medium text-sm">
                  Correo electrónico
                </label>
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
                    placeholder="john.doe@gmail.com"
                    className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed pl-8 border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-primary focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50"
                  />
                </div>
                {errors.email && (
                  <p className="text-error text-xs mt-1.5">{errors.email.message}</p>
                )}
              </div>

              <div className="mb-2">
                <label htmlFor="password" className="block mb-2 font-medium text-sm">
                  Contraseña
                </label>
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
                        message:
                          "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial",
                      },
                    })}
                    autoComplete="off"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="••••••••"
                    className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed pl-8 border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-primary focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
                  >
                    {showPassword ? (
                      <AuthIcons.EyeOffIcon className="size-4" />
                    ) : (
                      <AuthIcons.EyeIcon className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-error text-xs mt-1.5">{errors.password.message}</p>
                )}
              </div>

              <div className="mb-2">
                <label htmlFor="confirm-password" className="block mb-2 font-medium text-sm">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <AuthIcons.LockIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary dark:text-text-secondary-dark" />
                  <input
                    {...register("confirmPassword", {
                      required: {
                        value: true,
                        message: "La confirmación de la contraseña es requerida",
                      },
                      validate: {
                        matchPassword: (value) =>
                          value === getValues("password") || "Las contraseñas no coinciden",
                      },
                    })}
                    autoComplete="off"
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm-password"
                    placeholder="••••••••"
                    className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed pl-8 border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-primary focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
                  >
                    {showConfirmPassword ? (
                      <AuthIcons.EyeOffIcon className="size-4" />
                    ) : (
                      <AuthIcons.EyeIcon className="size-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-error text-xs mt-1.5">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/80 dark:bg-primary dark:hover:bg-primary/80 transition-colors text-white py-2 rounded-md mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading === "register"}
              >
                {loading === "register" ? "Creando..." : "Crear cuenta"}
              </button>
            </form>
          </section>

          <footer className="mt-4">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center">
              O regístrate con
            </p>

            <div className="flex gap-2 justify-center [&>button]:flex [&>button]:items-center [&>button]:gap-2 [&>button]:bg-light-bg [&>button]:border [&>button]:border-light-bg-surface [&>button]:dark:bg-dark-bg [&>button]:dark:border-dark-bg-surface [&>button]:text-light-text-primary [&>button]:dark:text-dark-text-primary [&>button]:px-4 [&>button]:py-2 [&>button]:rounded-md [&>button]:mt-2 [&>button]:cursor-pointer">
              <button
                onClick={handleGithubLogin}
                type="button"
                className="hover:bg-light-bg/30 dark:hover:bg-dark-bg-surface/30 transition-colors"
              >
                <AuthIcons.GithubIcon className="size-5" />
                GitHub
              </button>
              <button
                onClick={handleGoogleLogin}
                type="button"
                className="hover:bg-light-bg/30 dark:hover:bg-dark-bg-surface/30 transition-colors"
              >
                <AuthIcons.GoogleIcon className="size-5" />
                Google
              </button>
            </div>

            <p className="text-sm text-center mt-4">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/authentication/login"
                className="text-secondary hover:text-secondary dark:text-primary dark:hover:text-primary/80 transition-colors hover:underline ml-1"
              >
                Inicia sesión
              </Link>
            </p>
          </footer>
        </article>
      </main>
    </PublicRoute>
  );
}
