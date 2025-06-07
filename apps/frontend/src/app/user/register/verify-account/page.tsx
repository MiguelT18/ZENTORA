"use client";

import { GlobalIcons } from "@/assets/icons";
import { useState, useRef, KeyboardEvent, ClipboardEvent, ChangeEvent, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { useNotification } from "@/context/NotificationContext";
import { useRouter } from "next/navigation";

export default function VerifyAccountPage() {
  const router = useRouter();
  const { addNotification } = useNotification();

  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    const lastFilledIndex = newCode.findLastIndex(digit => digit !== "");
    if (lastFilledIndex >= 0 && lastFilledIndex < 6) {
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const verifyCode = async () => {
    setIsLoading(true);
    const joinedCode = code.join("");

    try {
      const res = await axios.post(`/api/v1/auth/verify-email/${joinedCode}`);
      console.log(res.data);
      addNotification("success", res.data.message);
      localStorage.setItem("token", res.data.access_token);
      router.push("/");
    } catch (error: any) {
      addNotification("error", error.response.data.detail || "Ha ocurrido un error al verificar el código");
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    setIsLoading(true);
    try {
      const email = localStorage.getItem("email");
      if (!email) {
        addNotification("error", "No se encontró el correo electrónico");
        return;
      }

      const res = await axios.post("/api/v1/auth/resend-verification", {
        email,
      });
      addNotification("success", res.data.message);
    } catch (error: any) {
      addNotification("error", error.response.data.detail || "Ha ocurrido un error al reenviar el código");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const isComplete = code.every(digit => digit !== "");

    if (isComplete) {
      verifyCode();
    }
  }, [code]);

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh max-sm:px-4">
      <article className="w-full max-w-md bg-white dark:bg-surface-dark p-8 max-sm:mt-4 max-sm:p-4 rounded-lg shadow-md border border-surface dark:border-surface-dark">
        <header>
          <span className="block size-fit rounded-full bg-primary/10 dark:bg-primary-dark/10 p-3 mx-auto mb-4">
            <GlobalIcons.AnimatedEmailIcon className="size-8 text-primary dark:text-primary-dark mx-auto" />
          </span>

          <h1 className="text-xl font-bold mb-2 text-center">Verificar Cuenta</h1>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark text-center">
            Hemos enviado un código de 6 dígitos a
            <span className="text-text-primary dark:text-text-primary-dark block">correo@ejemplo.com</span>
          </p>
        </header>

        <section className="mt-6">
          <div className="flex justify-center gap-2">
            {Array(6).fill(null).map((_, index) => (
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-xl font-bold border-2 border-border rounded-lg bg-background dark:bg-background-dark dark:text-white text-black focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200 hover:border-primary/50 border-surface dark:border-surface-dark"
              />
            ))}
          </div>

          <p className="text-sm text-text-secondary dark:text-text-secondary-dark text-center mt-4">
            Ingresa el código de 6 dígitos o pégalo desde tu correo
          </p>

          <button
            className="w-full bg-primary hover:bg-primary/80 transition-colors text-white py-2 rounded-md mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={code.some(digit => !digit) || isLoading}
          >
            {isLoading ? "Verificando..." : "Verificar Código"}
          </button>
        </section>

        <footer className="mt-6 flex flex-col items-center">
          <p className="block text-sm text-text-secondary dark:text-text-secondary-dark text-center">
            ¿No recibiste el código?
          </p>

          <button onClick={resendCode} className="bg-background dark:bg-background-dark transition-colors text-primary dark:text-primary-dark px-4 py-2 rounded-md mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-fit flex items-center border border-border dark:border-border-dark hover:bg-primary/10 dark:hover:bg-primary-dark/10 ">
            <GlobalIcons.RestartIcon className="size-4 mr-2 text-primary dark:text-primary-dark" />
            Reenviar Código
          </button>

          <Link href="/user/login" className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-secondary-dark text-center mt-4 hover:text-primary dark:hover:text-primary-dark transition-colors cursor-pointer">
            <GlobalIcons.ArrowIcon className="size-4 rotate-180" />
            Volver al inicio de sesión
          </Link>
        </footer>
      </article>
    </main>
  );
}
