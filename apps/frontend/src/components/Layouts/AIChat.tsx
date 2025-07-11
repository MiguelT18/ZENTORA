import type { view } from "@/utils/types";

export default function AIChat({ view }: { view: view }) {
  return (
    <aside
      className={`${
        view === "chat" ? "max-lg:block" : "max-lg:hidden"
      } fixed size-full lg:static bg-light-bg-secondary dark:bg-dark-bg-secondary`}
    >
      <header>
        <h1 className="text-center">Chat con NexaAI</h1>
      </header>
    </aside>
  );
}
