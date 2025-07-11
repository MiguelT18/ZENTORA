import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useSubscription } from "./subscriptionContext";
import ProgressBar from "./ProgressBar";
import { GlobalIcons } from "@/assets/icons";
import { UserControls } from "@/components/UI/UserControls";

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

interface PlanData {
  key: string;
  title: string;
  price: string;
  priceYearly: string;
  period: string;
  periodYearly: string;
  description: string;
  button: string;
  payment: string;
  paymentYearly: string;
  features: string[];
  isPro: boolean;
  discountPercentage: number;
}

const plansData: PlanData[] = [
  {
    key: "free",
    title: "Free",
    price: "$0",
    priceYearly: "$0",
    period: "de por vida",
    periodYearly: "de por vida",
    description: "Herramientas limitadas para traders novatos.",
    button: "Regístrate ahora",
    payment: "Ingresa gratis ahora",
    paymentYearly: "Ingresa gratis ahora",
    features: freePlanFeatures,
    isPro: false,
    discountPercentage: 0,
  },
  {
    key: "pro",
    title: "Pro",
    price: "$10",
    priceYearly: "$96",
    period: "por mes",
    periodYearly: "por año",
    description: "Herramientas avanzadas para traders experimentados",
    button: "Adquirir ahora",
    payment: "Pagos mensuales",
    paymentYearly: "Pago anual (ahorra $24)",
    features: proPlanFeatures,
    isPro: true,
    discountPercentage: 20,
  },
];

const soonFeatures = [
  {
    icon: "my-icon",
    title: "Trading Directo en Zentora",
    description:
      "Permite ejecutar operaciones directamente desde la plataforma, eliminando la necesidad de usar brokers externos y optimizando la experiencia de análisis + ejecución.",
  },
  {
    icon: "my-icon",
    title: "Cuentas de Fondeo para Traders",
    description:
      "Accede a capital de inversión si demuestras consistencia y habilidades como trader. Zentora evaluará tu rendimiento y te conectará con programas de fondeo adaptados a tu perfil.",
  },
  {
    icon: "my-icon",
    title: "IA Predictiva Avanzada",
    description:
      "Modelos de inteligencia artifical entrenados para anticipar movimientos del mercado con mayor precisión, utilizando múltiples fuentes de datos y adaptándose a tu estilo de trading.",
  },
  {
    icon: "my-icon",
    title: "Ejecuciones Automáticas por Señales de IA",
    description:
      "Permite automatizar operaciones cuando se detectan condiciones específicas definidas por la IA, facilitando estrategias semi o totalmente automáticas según tu configuración",
  },
];

function PlansPageContent() {
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const { user } = useAuth();
  const router = useRouter();
  const {
    cuposTomados,
    cuposDisponibles,
    isLoaded,
    incrementarCupo,
    resetearCupos,
    porcentajeCompletado,
  } = useSubscription();

  const getPriceWithDiscount = (plan: PlanData) => {
    if (plan.isPro) {
      if (selectedPlan === "yearly") {
        const monthlyPrice = cuposDisponibles > 0 ? 10 : 20;
        const yearlyPrice = monthlyPrice * 12;
        const discountAmount = yearlyPrice * (plan.discountPercentage / 100);
        const finalPrice = yearlyPrice - discountAmount;
        return `$${finalPrice}`;
      } else {
        return cuposDisponibles > 0 ? "$10" : "$20";
      }
    }
    return selectedPlan === "yearly" ? plan.priceYearly : plan.price;
  };

  const getPeriod = (plan: PlanData) => {
    return selectedPlan === "yearly" ? plan.periodYearly : plan.period;
  };

  const getPaymentText = (plan: PlanData) => {
    if (plan.isPro && selectedPlan === "yearly") {
      const monthlyPrice = cuposDisponibles > 0 ? 10 : 20;
      const yearlyPrice = monthlyPrice * 12;
      const discountAmount = yearlyPrice * (plan.discountPercentage / 100);
      const savings = discountAmount;
      return `Pago anual (ahorra $${savings})`;
    }
    if (plan.isPro && selectedPlan === "monthly") {
      return cuposDisponibles > 0 ? "Pagos mensuales" : "Pagos mensuales (precio regular)";
    }
    return selectedPlan === "yearly" ? plan.paymentYearly : plan.payment;
  };

  const getSavings = (plan: PlanData) => {
    if (selectedPlan === "yearly" && plan.isPro) {
      const monthlyPrice = cuposDisponibles > 0 ? 10 : 20;
      const yearlyPrice = monthlyPrice * 12;
      const discountAmount = yearlyPrice * (plan.discountPercentage / 100);
      return discountAmount;
    }
    return 0;
  };

  const handleProSubscription = () => {
    if (cuposDisponibles > 0) {
      incrementarCupo();
      console.log("🔄 Procesando suscripción Pro...");
    }
  };

  const handleButtonClick = (plan: PlanData) => {
    if (!user) {
      router.push("/authenticate/register");
      return;
    }
    if (plan.isPro) {
      handleProSubscription();
    }
  };

  const handleResetCupos = () => {
    if (process.env.NODE_ENV === "development") {
      resetearCupos();
    }
  };

  return (
    <>
      <nav className="flex items-center justify-around h-[10dvh] border-b border-light-bg-surface dark:border-dark-bg-surface">
        <GlobalIcons.LogoIcon className="size-20" />
        <UserControls isDisengaged={false} />
      </nav>

      <main className="mt-10 container mx-auto">
        <header className="w-fit mx-auto flex flex-col items-center gap-4 px-4">
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
            <div className="flex-1">
              <h3 className="text-light-text-primary dark:text-dark-text-primary text-sm font-bold">
                ¡Oferta de Lanzamiento!
              </h3>
              <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">
                Solo quedan{" "}
                <span className="text-warning font-bold">
                  {isLoaded ? cuposDisponibles : "..."}
                </span>{" "}
                cupos con precio especial
              </p>
            </div>
            {process.env.NODE_ENV === "development" && (
              <button
                onClick={handleResetCupos}
                className="px-3 py-1 text-xs bg-error/20 text-error rounded-md hover:bg-error/30 transition-colors cursor-pointer"
                title="Resetear cupos (solo desarrollo)"
              >
                Reset Cupos
              </button>
            )}
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
              {selectedPlan === "yearly" ? "20%" : "50%"}
            </span>
          </div>

          <div className="flex justify-center max-md:flex-col gap-10 mt-10 lg:max-w-[70%] lg:mx-auto mx-4">
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
                    <span className="drop-shadow block w-max">Oferta Limitada</span>
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
                      className={`flex items-end gap-2 text-6xl font-black text-light-text-primary dark:text-dark-text-primary`}
                    >
                      {plan.isPro ? (
                        <>
                          {selectedPlan === "yearly" && (
                            <span className="text-2xl font-normal opacity-60 line-through text-light-text-secondary dark:text-dark-text-secondary">
                              ${cuposDisponibles > 0 ? 120 : 240}
                            </span>
                          )}
                          {selectedPlan === "monthly" && cuposDisponibles > 0 && (
                            <span className="text-2xl font-normal opacity-60 line-through text-light-text-secondary dark:text-dark-text-secondary">
                              $20
                            </span>
                          )}
                          <span className="text-6xl font-black text-light-text-primary dark:text-dark-text-primary">
                            {getPriceWithDiscount(plan)}
                          </span>
                        </>
                      ) : (
                        getPriceWithDiscount(plan)
                      )}
                      {getPeriod(plan) && (
                        <span className="text-md font-normal opacity-80">{getPeriod(plan)}</span>
                      )}
                    </h1>

                    {/* Mostrar ahorro para plan anual */}
                    {selectedPlan === "yearly" && plan.isPro && getSavings(plan) > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-success text-sm font-bold">
                          ¡Ahorras ${getSavings(plan)} al año!
                        </span>
                      </div>
                    )}

                    {/* Mostrar mensaje de oferta especial cuando hay cupos */}
                    {selectedPlan === "monthly" && plan.isPro && cuposDisponibles > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-warning text-sm font-bold">
                          ¡Oferta especial! Solo {cuposDisponibles} cupos restantes
                        </span>
                      </div>
                    )}

                    <p
                      className={`text-sm mt-4 text-light-text-secondary dark:text-dark-text-secondary`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  <button
                    disabled={
                      (!!user && plan.key === "free") ||
                      (plan.isPro && cuposDisponibles === 0) ||
                      (plan.isPro && !isLoaded)
                    }
                    onClick={() => handleButtonClick(plan)}
                    className={`w-full py-2 rounded-lg tracking-wide text-sm font-bold transition-colors duration-200 shadow-sm ${
                      !!user && plan.key === "free"
                        ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60"
                        : plan.isPro && (cuposDisponibles === 0 || !isLoaded)
                        ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60"
                        : "bg-secondary dark:bg-primary text-white hover:opacity-80 cursor-pointer transition-colors"
                    }`}
                  >
                    {!user
                      ? "Regístrate ahora"
                      : !!user && plan.key === "free"
                      ? "Plan actual"
                      : plan.isPro && !isLoaded
                      ? "Cargando..."
                      : plan.isPro && cuposDisponibles === 0
                      ? "Cupos agotados"
                      : plan.button}
                  </button>
                  <span
                    className={`block w-full text-center text-xs mt-2 text-light-text-secondary dark:text-dark-text-secondary`}
                  >
                    {getPaymentText(plan)}
                  </span>

                  {plan.isPro && (
                    <div className="bg-light-bg-surface dark:bg-dark-bg-surface p-4 rounded-lg mt-4">
                      <ProgressBar
                        porcentaje={porcentajeCompletado}
                        cuposTomados={cuposTomados}
                        cuposDisponibles={cuposDisponibles}
                        isLoaded={isLoaded}
                      />
                    </div>
                  )}
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
                          className={`size-4 text-secondary dark:text-primary`}
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

        <section className="container mx-auto mt-8 md:mt-16 px-4 md:px-6 mb-6">
          <article className="relative bg-gradient-to-br from-light-bg-secondary via-light-bg-secondary/95 to-light-bg-secondary/90 dark:from-dark-bg-secondary dark:via-dark-bg-secondary/95 dark:to-dark-bg-secondary/90 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl max-w-full md:max-w-[95%] mx-auto border border-light-bg-surface/50 dark:border-dark-bg-surface/50 shadow-xl md:shadow-2xl shadow-black/10 backdrop-blur-sm overflow-hidden">
            {/* Efectos de fondo */}
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-transparent to-primary/5 animate-pulse"></div>
            <div className="absolute top-0 left-0 w-16 h-16 md:w-32 md:h-32 bg-secondary/10 rounded-full blur-2xl md:blur-3xl animate-bounce"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 md:w-40 md:h-40 bg-primary/10 rounded-full blur-2xl md:blur-3xl animate-pulse"></div>

            <div className="relative z-10">
              {/* Header mejorado */}
              <div className="flex flex-col items-center mb-6 md:mb-8">
                <div className="relative mb-3 md:mb-4">
                  <div className="rounded-full p-3 md:p-4 bg-gradient-to-r from-secondary to-primary border-2 border-white/20 shadow-lg shadow-secondary/25 dark:shadow-primary/25 w-fit mx-auto">
                    <GlobalIcons.RocketIcon className="size-6 md:size-8 lg:size-10 text-white drop-shadow-lg" />
                  </div>
                </div>

                <header className="text-center px-2">
                  <h1 className="block text-xl md:text-2xl font-black text-balance text-center mb-2 md:mb-3 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                    Próximas características Pro
                  </h1>
                  <p className="block text-light-text-secondary dark:text-dark-text-secondary text-sm md:text-base lg:text-lg text-pretty text-center max-w-2xl mx-auto leading-relaxed">
                    Los usuarios Pro tendrán acceso automático a todas las nuevas características
                    que estamos desarrollando con tecnología de vanguardia.
                  </p>
                </header>
              </div>

              {/* Grid de características mejorado */}
              <ul className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {soonFeatures.map((newFeature, idx) => (
                  <li
                    key={idx}
                    className="group relative bg-gradient-to-br from-light-bg-surface via-light-bg-surface to-light-bg-surface/80 dark:from-dark-bg-surface dark:via-dark-bg-surface dark:to-dark-bg-surface/80 p-4 md:p-6 rounded-xl md:rounded-2xl border border-light-bg-surface/50 dark:border-dark-bg-surface/50 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-[1.01] md:hover:scale-[1.02] hover:-translate-y-1 backdrop-blur-sm"
                  >
                    {/* Efecto de brillo en hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl md:rounded-2xl"></div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 md:gap-4 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-lg md:rounded-xl flex items-center justify-center border border-secondary/30 dark:border-primary/30">
                          <GlobalIcons.ClockIcon className="size-4 md:size-5 lg:size-6 text-secondary dark:text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3">
                            <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary text-base md:text-lg leading-tight">
                              {newFeature.title}
                            </h3>
                            <span className="flex items-center gap-1 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-full border border-secondary/30 dark:border-primary/30 text-secondary dark:text-primary px-2 md:px-3 py-1 text-xs font-semibold shadow-sm w-fit">
                              <GlobalIcons.ClockIcon className="size-3" />
                              Próximamente
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm text-pretty leading-relaxed">
                        {newFeature.description}
                      </p>

                      {/* Indicador de progreso sutil */}
                      <div className="mt-3 md:mt-4 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-light-bg dark:bg-dark-bg rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-secondary to-primary rounded-full animate-pulse"
                            style={{ width: `${75 + idx * 5}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary font-medium whitespace-nowrap">
                          En desarrollo
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Footer mejorado */}
              <div className="mt-6 md:mt-10 text-center">
                <div className="inline-flex items-center gap-2 md:gap-3 bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/30 dark:border-primary/30 text-secondary dark:text-primary px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold shadow-lg text-sm">
                  <GlobalIcons.InfiniteIcon className="size-4 md:size-5" />
                  <span className="text-xs md:text-sm">
                    Y muchas más características en desarrollo...
                  </span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-secondary dark:bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-1.5 h-1.5 md:w-2 md:h-2 bg-secondary dark:bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 md:w-2 md:h-2 bg-secondary dark:bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}

export default PlansPageContent;
