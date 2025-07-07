import type { view } from "@/utils/types";

export default function MarketChart({ view }: { view: view }) {
  return (
    <aside className={`${view === "chart" ? "max-lg:block" : "max-lg:hidden"}`}>
      <header>
        <h1 className="text-center">Gráfica del Mercado</h1>
      </header>
    </aside>
  );
}
