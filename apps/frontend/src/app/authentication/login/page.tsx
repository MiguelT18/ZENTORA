"use client";

import Link from "next/link";
import { AuthIcons, GlobalIcons } from "@/assets/icons";
import { ChangeEvent, ClipboardEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useNotification } from "@/context/NotificationContext";
import { UserControls } from "@/components/UserControls";
import { PublicRoute } from "@/components/PublicRoute";
import ModalNotification from "@/components/Notification/ModalNotification";
import type { ModalNotification as ModalNotificationType } from "@/utils/types";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showNewPasswordRepeat, setShowNewPasswordRepeat] = useState<boolean>(false);
  const [canResetPassword, setCanResetPassword] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState<
    null | "login" | "sendCode" | "resetPassword" | "resendCode"
  >(null);
  const [modalNotification, setModalNotification] = useState<ModalNotificationType | null>(null);

  const { addNotification } = useNotification();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register: registerModal,
    handleSubmit: handleSubmitModal,
    formState: { errors: errorsModal },
    reset: resetModal,
  } = useForm({
    defaultValues: {
      "email-modal": "",
    },
  });

  const {
    register: registerResetPassword,
    handleSubmit: handleSubmitResetPassword,
    formState: { errors: errorsResetPassword },
    getValues,
    reset: resetResetPassword,
  } = useForm({
    defaultValues: {
      "new-password": "",
      "new-password-repeat": "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading("login");
      const res = await axios.post("/api/v1/auth/login", data);
      localStorage.setItem("success_login_message", res.data.message);
      window.location.replace("/");
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        addNotification(
          "error",
          e.response?.data?.detail || "Ha ocurrido un error al iniciar sesión"
        );
      } else {
        addNotification("error", "Ha ocurrido un error al iniciar sesión");
      }
    } finally {
      setLoading(null);
    }
  };

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

  const handleOpenModal = () => {
    const modal = document.getElementById("forgot-password-modal") as HTMLDialogElement;

    if (modal) {
      modal.showModal();
    }
  };

  const handleForgotPassword = async (data: { "email-modal": string }) => {
    try {
      setLoading("sendCode");
      const res = await axios.post("/api/v1/auth/forgot-password", {
        email: data["email-modal"],
      });
      setCanResetPassword(true);
      (document.getElementById("forgot-password-modal") as HTMLDialogElement | null)?.close();
      (document.getElementById("reset-password-modal") as HTMLDialogElement | null)?.showModal();
      setModalNotification({ message: res.data?.message, type: "info" });
    } catch (e) {
      if (axios.isAxiosError(e)) {
        setModalNotification({
          message:
            e.response?.data?.detail ||
            "Hubo un error al enviar el código de recuperación. Por favor, intenta nuevamente.",
          type: "error",
        });
      } else {
        setModalNotification({
          message: "Hubo un error al enviar el código de recuperación.",
          type: "error",
        });
      }
      (document.getElementById("forgot-password-modal") as HTMLDialogElement | null)?.close();
      resetModal();
    } finally {
      setLoading(null);
      setTimeout(() => setModalNotification(null), 5000);
    }
  };

  const handleResendCode = async () => {
    setLoading("resendCode");
    try {
      const email = (document.getElementById("email-modal") as HTMLInputElement | null)?.value;
      if (!email) {
        setModalNotification({ message: "No se encontró el correo electrónico", type: "error" });
        return;
      }
      const res = await axios.post("/api/v1/auth/forgot-password", { email });
      setModalNotification({ message: res.data?.message, type: "success" });
    } catch (e) {
      if (axios.isAxiosError(e)) {
        setModalNotification({
          message:
            e.response?.data?.detail ||
            "Hubo un error al reenviar el código. Por favor, intenta nuevamente.",
          type: "error",
        });
      } else {
        setModalNotification({
          message: "Hubo un error al reenviar el código.",
          type: "error",
        });
      }
    } finally {
      setLoading(null);
      setTimeout(() => setModalNotification(null), 5000);
    }
  };

  const handleResetPassword = async (data: {
    "new-password": string;
    "new-password-repeat": string;
  }) => {
    try {
      setLoading("resetPassword");
      const dataToSend = {
        token: code.join(""),
        new_password: data["new-password"],
      };
      const res = await axios.put("/api/v1/auth/reset-password", dataToSend);
      setCanResetPassword(false);
      setCode(Array(6).fill(""));
      resetModal();
      resetResetPassword();
      (document.getElementById("reset-password-modal") as HTMLDialogElement | null)?.close();
      addNotification("success", res.data?.message);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        setModalNotification({
          message:
            e.response?.data?.detail ||
            "Hubo un error al cambiar la contraseña. Por favor, intenta nuevamente.",
          type: "error",
        });
      } else {
        setModalNotification({
          message: "Hubo un error al cambiar la contraseña.",
          type: "error",
        });
      }
    } finally {
      setLoading(null);
      setTimeout(() => setModalNotification(null), 5000);
    }
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
    if (e.key === "Backspace" && !code[index]) {
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

  const handleCloseModal = () => {
    const modal = document.getElementById("forgot-password-modal") as HTMLDialogElement;
    if (modal) {
      modal.close();
      setCode(Array(6).fill(""));
      resetModal();
    }
  };

  const handleCloseResetPasswordModal = () => {
    const modal = document.getElementById("reset-password-modal") as HTMLDialogElement;
    if (modal) {
      modal.close();
      setCode(Array(6).fill(""));
      resetResetPassword();
      resetModal();
      setCanResetPassword(true);
    }
  };

  useEffect(() => {
    const isComplete = code.every((digit) => digit !== "");

    if (isComplete) {
      setCanResetPassword(false);
    } else {
      setCanResetPassword(true);
    }
  }, [code]);

  return (
    <PublicRoute>
      <UserControls />
      <main className="flex flex-col items-center justify-center min-h-dvh max-sm:px-4">
        <dialog
          closedby="any"
          id="forgot-password-modal"
          className="w-full m-auto overflow-hidden max-w-md bg-light-bg-secondary dark:bg-dark-bg-secondary p-8 max-sm:p-4 rounded-lg shadow-md border border-light-bg-surface dark:border-dark-bg-surface backdrop:backdrop-blur-sm max-sm:w-[90%] outline-none"
        >
          <header className="mb-4 text-center space-y-1">
            <h1 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary text-balance">
              Recuperar Contraseña
            </h1>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-pretty">
              Ingresa tu correo electrónico para recibir un código de recuperación
            </p>
          </header>

          <form onSubmit={handleSubmitModal(handleForgotPassword)}>
            <div className="mb-2">
              <label
                htmlFor="email"
                className="block mb-2 text-sm text-light-text-primary dark:text-dark-text-primary"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <AuthIcons.MailIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                <input
                  {...registerModal("email-modal", {
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
                  id="email-modal"
                  placeholder="Tu correo electrónico"
                  className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed pl-8 border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-secondary focus:border-secondary dark:focus:ring-primary dark:focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50"
                />
              </div>
              {errorsModal["email-modal"] && (
                <p className="text-error text-xs mt-2">{errorsModal["email-modal"].message}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row-reverse gap-2 mt-4">
              <button
                type="button"
                className="w-full border border-light-bg-surface dark:border-dark-text-secondary/25 hover:border-secondary hover:bg-secondary/10 hover:text-secondary dark:hover:border-primary dark:hover:bg-primary/10 dark:hover:text-primary transition-colors text-light-text-primary dark:text-dark-text-primary py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                onClick={handleCloseModal}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/80 dark:bg-primary dark:hover:bg-primary/80 transition-colors text-white py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={loading === "sendCode"}
              >
                {loading === "sendCode" ? "Enviando..." : "Enviar código"}
              </button>
            </div>
          </form>
        </dialog>

        <dialog
          id="reset-password-modal"
          className="w-full max-w-md m-auto bg-light-bg-secondary dark:bg-dark-bg-surface p-8 max-sm:p-4 rounded-lg shadow-md border border-light-bg-surface dark:border-dark-bg-surface backdrop:backdrop-blur-sm max-sm:w-[90%] outline-none"
        >
          <div className="text-center">
            <span className="block size-fit rounded-full bg-secondary/10 dark:bg-primary/10 p-3 mx-auto">
              <GlobalIcons.AnimatedEmailIcon className="size-8 text-secondary dark:text-primary dark:text-primary-dark mx-auto" />
            </span>

            <div className="py-2 space-y-1">
              <h2 className="text-xl font-bold text-text-primary dark:text-white text-balance">
                Revisa tu correo electrónico
              </h2>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-pretty">
                Ingresa el código de recuperación que te hemos enviado a tu correo electrónico
              </p>
            </div>
          </div>

          {modalNotification && (
            <ModalNotification message={modalNotification.message} type={modalNotification.type} />
          )}

          <form onSubmit={handleSubmitResetPassword(handleResetPassword)} className="mt-4">
            <div className="flex justify-center gap-2">
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

            <button
              type="button"
              onClick={handleResendCode}
              className="bg-background dark:bg-background-dark transition-colors text-secondary dark:text-primary px-4 py-2 rounded-md my-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-fit flex items-center border border-border dark:border-border-dark hover:bg-secondary/10 dark:hover:bg-primary/10 mx-auto"
              disabled={loading === "resendCode"}
            >
              <GlobalIcons.RestartIcon className="size-4 mr-2 text-secondary dark:text-primary" />
              {loading === "resendCode" ? "Reenviando..." : "Reenviar código"}
            </button>

            <div className="mt-2">
              <div>
                <label
                  htmlFor="new-password"
                  className="block mb-2 text-sm text-light-text-primary dark:text-dark-text-primary"
                >
                  Nueva contraseña
                </label>
                <div className="relative">
                  <AuthIcons.LockIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                  <input
                    {...registerResetPassword("new-password", {
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
                    type={showNewPassword ? "text" : "password"}
                    id="new-password"
                    placeholder="••••••••"
                    className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed pl-8 border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-secondary focus:border-secondary dark:focus:ring-primary dark:focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50 hover:border-secondary/50 dark:hover:border-primary/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors"
                  >
                    {showNewPassword ? (
                      <AuthIcons.EyeOffIcon className="size-5" />
                    ) : (
                      <AuthIcons.EyeIcon className="size-5" />
                    )}
                  </button>
                </div>
                {errorsResetPassword["new-password"] && (
                  <p className="text-error text-xs mt-1.5">
                    {errorsResetPassword["new-password"].message}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <label
                  htmlFor="new-password-repeat"
                  className="block mb-2 font-medium text-sm text-text-primary dark:text-white"
                >
                  Repetir contraseña
                </label>
                <div className="relative">
                  <AuthIcons.LockIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                  <input
                    {...registerResetPassword("new-password-repeat", {
                      required: {
                        value: true,
                        message: "La contraseña es requerida",
                      },
                      validate: {
                        matchPassword: (value) =>
                          value === getValues("new-password") || "Las contraseñas no coinciden",
                      },
                    })}
                    type={showNewPasswordRepeat ? "text" : "password"}
                    id="new-password-repeat"
                    placeholder="••••••••"
                    className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed pl-8 border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-secondary focus:border-secondary dark:focus:ring-primary dark:focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50 hover:border-secondary/50 dark:hover:border-primary/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasswordRepeat(!showNewPasswordRepeat)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors"
                  >
                    {showNewPasswordRepeat ? (
                      <AuthIcons.EyeOffIcon className="size-5" />
                    ) : (
                      <AuthIcons.EyeIcon className="size-5" />
                    )}
                  </button>
                </div>
                {errorsResetPassword["new-password-repeat"] && (
                  <p className="text-error text-xs mt-1.5">
                    {errorsResetPassword["new-password-repeat"].message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row-reverse gap-2 mt-4">
              <button
                type="button"
                className="w-full border border-light-bg-surface dark:border-dark-text-secondary/25 hover:border-secondary hover:bg-secondary/10 hover:text-secondary dark:hover:border-primary dark:hover:bg-primary/10 dark:hover:text-primary transition-colors text-light-text-primary dark:text-dark-text-primary py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                onClick={handleCloseResetPasswordModal}
              >
                Cancelar
              </button>

              <button
                disabled={canResetPassword || loading === "resetPassword"}
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/80 dark:bg-primary dark:hover:bg-primary/80 transition-colors text-white py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading === "resetPassword" ? "Cambiando..." : "Cambiar contraseña"}
              </button>
            </div>
          </form>
        </dialog>

        <article className="w-full max-w-md bg-light-bg-secondary dark:bg-dark-bg-secondary p-8 max-sm:mt-4 max-sm:p-4 rounded-lg shadow-md border border-light-bg-surface dark:border-dark-bg-surface">
          <header className="mb-4 text-center space-y-1">
            <h1 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Ingresa tus credenciales para acceder a tu cuenta
            </p>
          </header>

          <section>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-2">
                <label htmlFor="email" className="block mb-2 text-sm">
                  Correo electrónico
                </label>
                <div className="relative">
                  <AuthIcons.MailIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
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
                    disabled={false}
                    className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed pl-8 border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-primary focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50"
                  />
                </div>
                {errors.email && <p className="text-error text-xs mt-2">{errors.email.message}</p>}
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
                    })}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="••••••••"
                    className="flex w-full rounded-md border px-3 py-2 text-sm ring-offset-light-bg dark:ring-offset-dark-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed pl-8 border-light-bg-surface dark:border-dark-bg-surface bg-light-bg dark:bg-dark-bg placeholder:text-light-text-muted dark:placeholder:text-dark-text-muted focus:ring-primary focus:border-primary text-light-text-primary dark:text-dark-text-primary disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors"
                  >
                    {showPassword ? (
                      <AuthIcons.EyeOffIcon className="size-5" />
                    ) : (
                      <AuthIcons.EyeIcon className="size-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-error text-xs mt-2">{errors.password.message}</p>
                )}
              </div>

              <button
                onClick={handleOpenModal}
                type="button"
                className="w-fit text-info text-sm block cursor-pointer hover:underline hover:text-info/80 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>

              <button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/80 dark:bg-primary dark:hover:bg-primary/80 transition-colors text-white tracking-wider py-2 rounded-md mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={loading === "login"}
              >
                {loading === "login" ? "Iniciando..." : "Iniciar Sesión"}
              </button>
            </form>
          </section>

          <footer className="mt-4">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center">
              O continúa con
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
              ¿No tienes una cuenta?{" "}
              <Link
                href="/authentication/register"
                className="text-secondary hover:text-secondary/80 dark:text-primary dark:hover:text-primary/80 transition-colors hover:underline ml-1"
              >
                Regístrate
              </Link>
            </p>
          </footer>
        </article>
      </main>
    </PublicRoute>
  );
}
