"use client";

import { GlobalIcons } from "@/assets/icons";
import { UserControls } from "@/components/UserControls";
import { useState } from "react";

export default function PlansPage() {
  const plans = [
    { key: "monthly", label: "Mensual" },
    { key: "yearly", label: "Anual" },
  ];

  const freePlanFeatures = [
    "Consultas limitadas con Nexa AI (15 por día).",
    "Análisis técnico básico de activos populares.",
    "Resumen de mercado diario (1 activo).",
    "Estilo de trading guardado (limitado).",
    "Historial de conversaciones recientes.",
    "Glosario de trading y guías rápidas.",
    "Notificaciones clave del mercado.",
    "Acceso a comunidad de traders.",
  ];

  const proPlanFeatures = [
    "Consultas ilimitadas con Nexa AI.",
    "Análisis técnico profundo y comparativo.",
    "Backtesting automático de estrategias.",
    "Adaptación completa al perfil del trader.",
    "Alertas inteligentes y personalizadas.",
    "Escaneo multi-activo con condiciones.",
    "Gestión de riesgos con IA.",
    "Resumen diario personalizado.",
    "Soporte prioritario y early access a nuevas features.",
  ];

  const [selectedPlan, setSelectedPlan] = useState("monthly");

  const plansData = [
    {
      key: "free",
      title: "Free",
      price: "$0",
      period: "de por vida",
      description: "Herramientas limitadas para traders novatos.",
      button: "Regístrate ahora",
      payment: "Ingresa gratis ahora",
      features: freePlanFeatures,
      isPro: false,
    },
    {
      key: "pro",
      title: "Pro",
      price: "$10",
      period: "por mes",
      description: "Herramientas avanzadas para traders experimentados",
      button: "Adquirir ahora",
      payment: "Pagos mensuales",
      features: proPlanFeatures,
      isPro: true,
    },
  ];

  return (
    <>
      <nav className="flex items-center justify-around h-[10dvh] border-b border-light-bg-surface dark:border-dark-bg-surface">
        <GlobalIcons.LogoIcon className="size-20" />

        <UserControls isDisengaged={false} />
      </nav>

      <main className="mt-10 container mx-auto">
        <header className="w-fit mx-auto flex flex-col items-center gap-4">
          <span className="flex items-center gap-2 text-secondary dark:text-primary text-sm border rounded-full border-secondary dark:border-primary w-fit px-4 py-2 bg-secondary/10 dark:bg-primary/10">
            <GlobalIcons.ProTagIcon className="size-4" />
            Planes de Zentora
          </span>

          <div className="w-fit flex flex-col items-center gap-2">
            <h1 className="w-fit block text-light-text-primary dark:text-dark-text-primary font-black text-4xl uppercase text-center">
              Elige tu plan
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                perfecto
              </span>
            </h1>
            <p className="block text-light-text-secondary dark:text-dark-text-secondary text-md text-center w-fit text-pretty max-w-[90%]">
              Desbloquea todo el potencial de tu trading con herramientas profesionales e IA
              avanzada.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-light-bg-secondary dark:bg-dark-bg-secondary py-4 px-6 my-2 rounded-lg shadow-lg shadow-black/20">
            <GlobalIcons.TimerIcon className="size-6 text-warning" />

            <div>
              <h3 className="text-light-text-primary dark:text-dark-text-primary text-sm font-bold">
                ¡Oferta de Lanzamiento!
              </h3>
              <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">
                Solo quedan <span className="text-warning font-bold">50</span> cupos con precio
                especial
              </p>
            </div>
          </div>
        </header>

        <section className="mt-6 container mx-auto">
          <div className="w-fit mx-auto flex items-center dark:bg-dark-bg-secondary bg-light-bg-secondary p-0.5 dark:border-dark-bg-surface border-light-bg-surface border-1 backdrop-blur-sm rounded-md relative">
            {plans.map((plan, i) => (
              <button
                key={i}
                onClick={() => setSelectedPlan(plan.key)}
                className={`rounded-[inherit] text-sm tracking-wider font-bold py-2 px-8 duration-300 ease-in-out transform cursor-pointer ${
                  selectedPlan === plan.key
                    ? "bg-secondary text-white dark:bg-primary"
                    : "bg-transparent dark:hover:bg-dark-bg-surface hover:bg-light-bg-surface"
                }`}
              >
                {plan.label}
              </button>
            ))}
            <span className="bg-gradient-to-r from-secondary to-primary block px-2.5 py-1 rounded-full text-xs font-black absolute -right-5 -top-3 shadow-md shadow-black/30 text-white rotate-12">
              20%
            </span>
          </div>

          <div className="flex justify-center max-sm:flex-col gap-10 mt-10 lg:max-w-[70%] lg:mx-auto mx-4">
            {plansData.map((plan) => (
              <article
                key={plan.key}
                className={`relative w-full h-fit mx-auto rounded-3xl border border-light-bg-surface dark:border-dark-bg-surface p-8 shadow-md transition-all duration-300 hover:shadow-2xl flex flex-col bg-white/80 dark:bg-dark-bg-secondary`}
              >
                {plan.isPro && (
                  <span
                    className="absolute left-1/2 -translate-x-1/2 -top-4 text-white bg-gradient-to-r from-warning to-error w-fit rounded-full flex items-center gap-2 px-7 py-2 text-sm font-bold shadow-lg shadow-black/30 border-2 border-white/40 ring-2 ring-white/20 backdrop-blur-md"
                    style={{
                      boxShadow:
                        "0 4px 24px 0 rgba(255, 193, 7, 0.25), 0 1.5px 8px 0 rgba(220, 38, 38, 0.15)",
                    }}
                  >
                    <GlobalIcons.TimerIcon className="size-5 drop-shadow" />
                    <span className="drop-shadow">Oferta Limitada</span>
                  </span>
                )}

                <header>
                  <h3
                    className={`font-bold text-xl mb-2 text-light-text-secondary dark:text-dark-text-secondary`}
                  >
                    {plan.title}
                  </h3>
                  <div className="my-4">
                    <h1
                      className={`flex items-end gap-2 text-5xl font-black text-light-text-primary dark:text-dark-text-primary`}
                    >
                      {plan.price}
                      {plan.period && (
                        <span className="text-md font-normal opacity-80">{plan.period}</span>
                      )}
                    </h1>
                    <p
                      className={`text-sm mt-4 text-light-text-secondary dark:text-dark-text-secondary`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  <button
                    className={`w-full py-2 rounded-lg tracking-wide text-sm font-bold transition-colors duration-200 shadow-sm cursor-pointer bg-secondary dark:bg-primary text-white hover:opacity-90`}
                  >
                    {plan.button}
                  </button>
                  <span
                    className={`block w-full text-center text-xs mt-2 text-light-text-secondary dark:text-dark-text-secondary`}
                  >
                    {plan.payment}
                  </span>
                </header>

                <hr className={`my-6 text-light-text-disabled dark:text-dark-text-disabled`} />

                <div className="flex-1 flex flex-col justify-between">
                  <span
                    className={`text-sm mb-4 block font-semibold text-light-text-primary dark:text-dark-text-primary`}
                  >
                    {plan.isPro
                      ? "Todas las características gratuitas más"
                      : "Características gratis incluidas"}
                  </span>

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <GlobalIcons.CheckIcon
                          className={`size-4 ${
                            plan.isPro ? "text-white" : "text-secondary dark:text-primary"
                          }`}
                        />
                        <span
                          className={`block text-sm text-light-text-secondary dark:text-dark-text-secondary`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
