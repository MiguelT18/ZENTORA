import { GlobalIcons, MainIcons } from "@/assets/icons";
import DropdownMenu, { AnimatedDropdown } from "@/components/UI/Dropdown";
import { useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";

interface MarketChartControlsProps {
  timeframeDropdownRef: RefObject<HTMLButtonElement | null>;
  openDropdown: (dropdownType: string) => void;
  timeframeDropdownOpen: boolean;
  setTimeframeDropdownOpen: (value: SetStateAction<boolean>) => void;
  chartTypeDropdownRef: RefObject<HTMLButtonElement | null>;
  chartTypeDropdownOpen: boolean;
  drawingDropdownRef: RefObject<HTMLButtonElement | null>;
  drawingDropdownOpen: boolean;
  setChartTypeDropdownOpen: Dispatch<SetStateAction<boolean>>;
  indicatorsDropdownRef: RefObject<HTMLButtonElement | null>;
  indicatorsDropdownOpen: boolean;
  optionsDropdownRef: RefObject<HTMLButtonElement | null>;
  optionsDropdownOpen: boolean;
  selectedControls: {
    timeframe: string;
    chartType: string;
    drawTool: string;
    indicator: string;
    more: string;
  };
  setSelectedControls: Dispatch<
    SetStateAction<{
      timeframe: string;
      chartType: string;
      drawTool: string;
      indicator: string;
      more: string;
    }>
  >;
}

export default function MarketChartControls(props: MarketChartControlsProps) {
  const {
    timeframeDropdownRef,
    openDropdown,
    timeframeDropdownOpen,
    setTimeframeDropdownOpen,
    chartTypeDropdownRef,
    chartTypeDropdownOpen,
    drawingDropdownRef,
    drawingDropdownOpen,
    setChartTypeDropdownOpen,
    indicatorsDropdownRef,
    indicatorsDropdownOpen,
    optionsDropdownRef,
    optionsDropdownOpen,
    selectedControls,
    setSelectedControls,
  } = props;

  const chartTypeOptions = [
    { value: "candlestick", label: "Velas" },
    { value: "line", label: "Líneas" },
    { value: "area", label: "Áreas" },
    { value: "bars", label: "Barras" },
  ];

  const timeframeOptions = [
    { value: "1m", label: "1m" },
    { value: "5m", label: "5m" },
    { value: "15m", label: "15m" },
    { value: "1h", label: "1h" },
    { value: "4h", label: "4h" },
    { value: "1d", label: "1D" },
    { value: "1w", label: "1W" },
    { value: "1M", label: "1M" },
  ];

  const drawToolsOptions = {
    lines: [
      { value: "cursor", label: "Cursor" },
      { value: "line", label: "Línea" },
      { value: "trend-line", label: "Línea de tendencia" },
      { value: "horizontal-line", label: "Línea horizontal" },
      { value: "vertical-line", label: "Línea vertical" },
      { value: "free-draw", label: "Dibujo libre" },
    ],
    geometry: [
      { value: "rectangle", label: "Rectángulo" },
      { value: "circle", label: "Círculo" },
      { value: "triangle", label: "Triángulo" },
    ],
    other: [{ value: "text", label: "Texto" }],
  };

  const indicatorsOptions = [
    { value: "ema-sma", label: "EMA / SMA" },
    { value: "rsi", label: "RSI" },
    { value: "macd", label: "MACD" },
    { value: "bollinger-bands", label: "Bandas de Bollinger" },
  ];

  const moreOptions = [
    { value: "clean-draws", label: "Limpiar dibujos" },
    { value: "export-image", label: "Exportar imagen" },
    { value: "export-image", label: "Configuración" },
  ];

  useEffect(() => {
    console.log(selectedControls.drawTool);
  }, [selectedControls, setSelectedControls]);

  return (
    <div className="flex items-center justify-end mb-4 p-3 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg border border-light-bg-surface dark:border-dark-bg-surface">
      {/* Controles del gráfico */}
      <div className="w-full flex items-center justify-between gap-2">
        {/* Temporalidad */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-light-text-secondary dark:text-dark-text-secondary">
            <GlobalIcons.ClockIcon className="size-4" />
            <span className="text-sm">Temporalidades</span>
          </div>
          <div className="flex items-center max-lg:hidden">
            {timeframeOptions.map((option, idx) => (
              <button
                onClick={() =>
                  setSelectedControls((prev) => ({
                    ...prev,
                    timeframe: option.value,
                  }))
                }
                key={idx}
                type="button"
                className={`${
                  selectedControls.timeframe === option.value
                    ? "bg-secondary dark:bg-primary text-white"
                    : "hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors"
                } p-2 text-sm cursor-pointer rounded-md outline-none`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="relative lg:hidden">
            <button
              onClick={() => openDropdown("timeframe")}
              ref={timeframeDropdownRef}
              type="button"
              className="p-2 bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface rounded-md text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors flex items-center gap-2 outline-none"
            >
              {selectedControls.timeframe}
              <GlobalIcons.ArrowIcon className="size-full rotate-90" />
            </button>
            <AnimatedDropdown
              isOpen={timeframeDropdownOpen}
              triggerRef={timeframeDropdownRef}
              position="left"
            >
              <div>
                {timeframeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedControls((prev) => ({
                        ...prev,
                        timeframe: option.value,
                      }));
                      setTimeframeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1 text-sm rounded cursor-pointer transition-colors outline-none ${
                      selectedControls.timeframe === option.value
                        ? "bg-secondary dark:bg-primary text-white hover:cursor-not-allowed"
                        : "text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </AnimatedDropdown>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {/* Tipo de gráfico */}
          <div className="flex flex-col gap-1">
            <div className="relative">
              <button
                ref={chartTypeDropdownRef}
                onClick={() => openDropdown("chartType")}
                title="Seleccionar tipo de visualización"
                className="px-3 py-1.5 text-sm bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface rounded-md text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors flex flex-row-reverse items-center gap-2 cursor-pointer outline-none"
              >
                <span>
                  {chartTypeOptions.find((opt) => opt.value === selectedControls.chartType)?.label}
                </span>
                <MainIcons.CandlestickIcon className="size-4" />
              </button>
              <AnimatedDropdown
                isOpen={chartTypeDropdownOpen}
                triggerRef={chartTypeDropdownRef}
                position="left"
              >
                <DropdownMenu className="w-32">
                  {chartTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedControls((prev) => ({
                          ...prev,
                          chartType: option.value,
                        }));
                        setChartTypeDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 text-sm rounded cursor-pointer transition-colors outline-none ${
                        selectedControls.chartType === option.value
                          ? "bg-secondary dark:bg-primary text-white hover:cursor-not-allowed"
                          : "text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </DropdownMenu>
              </AnimatedDropdown>
            </div>
          </div>

          {/* Herramientas de dibujo */}
          <div className="relative">
            <button
              ref={drawingDropdownRef}
              onClick={() => openDropdown("drawing")}
              title="Herramientas de dibujo y anotación"
              className="px-3 py-1.5 text-sm bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface rounded-md text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors cursor-pointer outline-none"
            >
              <MainIcons.ColorsIcon className="size-4 inline" />
            </button>
            <AnimatedDropdown
              isOpen={drawingDropdownOpen}
              triggerRef={drawingDropdownRef}
              position="left"
            >
              <DropdownMenu className="w-48">
                <div className="pb-2">
                  <div className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary p-2">
                    Líneas
                  </div>
                  {drawToolsOptions.lines.map((tool, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedControls((prev) => ({
                          ...prev,
                          drawTool: tool.value,
                        }));
                      }}
                      className={`w-full text-left p-2 text-sm rounded cursor-pointer transition-colors outline-none ${
                        selectedControls.drawTool === tool.value
                          ? "bg-secondary dark:bg-primary text-white hover:cursor-not-allowed"
                          : "text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
                      }`}
                    >
                      {tool.label}
                    </button>
                  ))}
                </div>
                <div className="border-t border-light-bg-surface dark:border-dark-bg-surface">
                  <div className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary p-2">
                    Formas
                  </div>
                  {drawToolsOptions.geometry.map((tool, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedControls((prev) => ({
                          ...prev,
                          drawTool: tool.value,
                        }));
                      }}
                      className={`w-full text-left p-2 text-sm rounded cursor-pointer transition-colors outline-none ${
                        selectedControls.drawTool === tool.value
                          ? "bg-secondary dark:bg-primary text-white hover:cursor-not-allowed"
                          : "text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
                      }`}
                    >
                      {tool.label}
                    </button>
                  ))}
                </div>
                <div className="border-t border-light-bg-surface dark:border-dark-bg-surface">
                  <div className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary p-2">
                    Otros
                  </div>
                  {drawToolsOptions.other.map((tool, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedControls((prev) => ({
                          ...prev,
                          drawTool: tool.value,
                        }));
                      }}
                      className={`w-full text-left p-2 text-sm rounded cursor-pointer transition-colors outline-none ${
                        selectedControls.drawTool === tool.value
                          ? "bg-secondary dark:bg-primary text-white hover:cursor-not-allowed"
                          : "text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
                      }`}
                    >
                      {tool.label}
                    </button>
                  ))}
                </div>
              </DropdownMenu>
            </AnimatedDropdown>
          </div>

          {/* Indicadores */}
          <div className="relative">
            <button
              ref={indicatorsDropdownRef}
              onClick={() => openDropdown("indicators")}
              title="Indicadores técnicos y análisis"
              className="px-3 py-1.5 text-sm bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface rounded-md text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors cursor-pointer outline-none"
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
                {indicatorsOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedControls((prev) => ({
                        ...prev,
                        indicator: option.value,
                      }));
                    }}
                    className={`w-full text-left p-2 text-sm rounded cursor-pointer transition-colors outline-none ${
                      selectedControls.indicator === option.value
                        ? "bg-secondary dark:bg-primary text-white hover:cursor-not-allowed"
                        : "text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </DropdownMenu>
            </AnimatedDropdown>
          </div>

          {/* Menú de opciones */}
          <div>
            <div className="relative h-full">
              <button
                ref={optionsDropdownRef}
                onClick={() => openDropdown("options")}
                title="Configuración y opciones adicionales"
                className="h-full px-3 py-1.5 text-sm bg-light-bg dark:bg-dark-bg border border-light-bg-surface dark:border-dark-bg-surface rounded-md text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-surface dark:hover:bg-dark-bg-surface transition-colors cursor-pointer outline-none"
              >
                <MainIcons.MoreVerticalIcon className="size-4" />
              </button>
              <AnimatedDropdown
                isOpen={optionsDropdownOpen}
                triggerRef={optionsDropdownRef}
                position="right"
              >
                <DropdownMenu className="w-48">
                  {moreOptions.map((option, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left p-2 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded cursor-pointer"
                    >
                      {option.label}
                    </button>
                  ))}
                </DropdownMenu>
              </AnimatedDropdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
