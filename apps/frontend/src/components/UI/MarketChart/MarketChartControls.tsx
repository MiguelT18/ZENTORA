import { GlobalIcons, MainIcons } from "@/assets/icons";
import DropdownMenu, { AnimatedDropdown } from "@/components/UI/Dropdown";
import type { Dispatch, RefObject, SetStateAction } from "react";

interface MarketChartControlsProps {
  timeframeDropdownRef: RefObject<HTMLButtonElement | null>;
  timeframeOptions: {
    value: string;
    label: string;
  }[];
  openDropdown: (dropdownType: string) => void;
  selectedTimeframe: string;
  timeframeDropdownOpen: boolean;
  setSelectedTimeframe: Dispatch<SetStateAction<string>>;
  setTimeframeDropdownOpen: (value: SetStateAction<boolean>) => void;
  chartTypeDropdownRef: RefObject<HTMLButtonElement | null>;
  chartTypeOptions: {
    value: string;
    label: string;
  }[];
  selectedChartType: string;
  chartTypeDropdownOpen: boolean;
  setSelectedChartType: Dispatch<SetStateAction<string>>;
  drawingDropdownRef: RefObject<HTMLButtonElement | null>;
  drawingDropdownOpen: boolean;
  setChartTypeDropdownOpen: Dispatch<SetStateAction<boolean>>;
  indicatorsDropdownRef: RefObject<HTMLButtonElement | null>;
  indicatorsDropdownOpen: boolean;
  optionsDropdownRef: RefObject<HTMLButtonElement | null>;
  optionsDropdownOpen: boolean;
}

export default function MarketChartControls(props: MarketChartControlsProps) {
  const {
    timeframeDropdownRef,
    timeframeOptions,
    openDropdown,
    selectedTimeframe,
    timeframeDropdownOpen,
    setSelectedTimeframe,
    setTimeframeDropdownOpen,
    chartTypeDropdownRef,
    chartTypeOptions,
    selectedChartType,
    chartTypeDropdownOpen,
    setSelectedChartType,
    drawingDropdownRef,
    drawingDropdownOpen,
    setChartTypeDropdownOpen,
    indicatorsDropdownRef,
    indicatorsDropdownOpen,
    optionsDropdownRef,
    optionsDropdownOpen,
  } = props;

  return (
    <div className="flex items-center justify-end mb-4 p-3 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg border border-light-bg-surface dark:border-dark-bg-surface">
      {/* Controles del gráfico */}
      <div className="flex items-center gap-4">
        {/* Temporalidad */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Temporalidad
          </label>
          <div className="relative">
            <button
              ref={timeframeDropdownRef}
              onClick={() => openDropdown("timeframe")}
              title="Seleccionar intervalo de tiempo"
              className="px-3 py-1.5 text-sm bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface rounded-md text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors flex items-center gap-2"
            >
              <span>{timeframeOptions.find((opt) => opt.value === selectedTimeframe)?.label}</span>
              <GlobalIcons.ArrowIcon className="size-3 rotate-90" />
            </button>
            <AnimatedDropdown
              isOpen={timeframeDropdownOpen}
              triggerRef={timeframeDropdownRef}
              position="left"
            >
              <DropdownMenu className="w-24">
                <div className="p-1">
                  {timeframeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedTimeframe(option.value);
                        setTimeframeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1 text-sm rounded cursor-pointer transition-colors ${
                        selectedTimeframe === option.value
                          ? "bg-secondary dark:bg-primary text-white"
                          : "text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </DropdownMenu>
            </AnimatedDropdown>
          </div>
        </div>

        {/* Tipo de gráfico */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Tipo de Gráfico
          </label>
          <div className="relative">
            <button
              ref={chartTypeDropdownRef}
              onClick={() => openDropdown("chartType")}
              title="Seleccionar tipo de visualización"
              className="px-3 py-1.5 text-sm bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface rounded-md text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors flex items-center gap-2"
            >
              <span>{chartTypeOptions.find((opt) => opt.value === selectedChartType)?.label}</span>
              <GlobalIcons.ArrowIcon className="size-3 rotate-90" />
            </button>
            <AnimatedDropdown
              isOpen={chartTypeDropdownOpen}
              triggerRef={chartTypeDropdownRef}
              position="left"
            >
              <DropdownMenu className="w-32">
                <div className="p-1">
                  {chartTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedChartType(option.value);
                        setChartTypeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1 text-sm rounded cursor-pointer transition-colors ${
                        selectedChartType === option.value
                          ? "bg-secondary dark:bg-primary text-white"
                          : "text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </DropdownMenu>
            </AnimatedDropdown>
          </div>
        </div>

        {/* Herramientas de dibujo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Herramientas
          </label>
          <div className="relative">
            <button
              ref={drawingDropdownRef}
              onClick={() => openDropdown("drawing")}
              title="Herramientas de dibujo y anotación"
              className="px-3 py-1.5 text-sm bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface rounded-md text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors"
            >
              <MainIcons.EditIcon className="size-4 inline mr-1" />
              Dibujo
            </button>
            <AnimatedDropdown
              isOpen={drawingDropdownOpen}
              triggerRef={drawingDropdownRef}
              position="left"
            >
              <DropdownMenu className="w-48">
                <div className="p-2">
                  <div className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2 px-2">
                    Líneas
                  </div>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Cursor
                  </button>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Línea
                  </button>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Línea de tendencia
                  </button>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Línea horizontal
                  </button>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Línea vertical
                  </button>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Dibujo libre
                  </button>
                </div>
                <div className="border-t border-light-bg-surface dark:border-dark-bg-surface p-2">
                  <div className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2 px-2">
                    Formas
                  </div>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Rectángulo
                  </button>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Círculo
                  </button>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Triángulo
                  </button>
                </div>
                <div className="border-t border-light-bg-surface dark:border-dark-bg-surface p-2">
                  <div className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2 px-2">
                    Otros
                  </div>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Texto
                  </button>
                </div>
              </DropdownMenu>
            </AnimatedDropdown>
          </div>
        </div>

        {/* Indicadores */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Indicadores
          </label>
          <div className="relative">
            <button
              ref={indicatorsDropdownRef}
              onClick={() => openDropdown("indicators")}
              title="Indicadores técnicos y análisis"
              className="px-3 py-1.5 text-sm bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface rounded-md text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors"
            >
              <MainIcons.SettingsIcon className="size-4 inline mr-1" />
              Indicadores
            </button>
            <AnimatedDropdown
              isOpen={indicatorsDropdownOpen}
              triggerRef={indicatorsDropdownRef}
              position="left"
            >
              <DropdownMenu className="w-48">
                <div className="p-2">
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    EMA / SMA
                  </button>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    RSI
                  </button>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    MACD
                  </button>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Bandas de Bollinger
                  </button>
                </div>
              </DropdownMenu>
            </AnimatedDropdown>
          </div>
        </div>

        {/* Menú de opciones */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Opciones
          </label>
          <div className="relative">
            <button
              ref={optionsDropdownRef}
              onClick={() => openDropdown("options")}
              title="Configuración y opciones adicionales"
              className="px-3 py-1.5 text-sm bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface rounded-md text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors"
            >
              <MainIcons.MoreVerticalIcon className="size-4" />
            </button>
            <AnimatedDropdown
              isOpen={optionsDropdownOpen}
              triggerRef={optionsDropdownRef}
              position="right"
            >
              <DropdownMenu className="w-48">
                <div className="p-2">
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Limpiar dibujos
                  </button>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Exportar imagen
                  </button>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Configuración
                  </button>
                  <button className="w-full text-left px-2 py-1 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer">
                    Restablecer vista
                  </button>
                </div>
              </DropdownMenu>
            </AnimatedDropdown>
          </div>
        </div>
      </div>
    </div>
  );
}
