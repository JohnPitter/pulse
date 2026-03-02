import { useAgentsStore } from "../../stores/agents";

export function Header() {
  const agents = useAgentsStore((s) => s.agents);
  const onlineCount = agents.filter(
    (a) => a.status === "running" || a.status === "waiting",
  ).length;

  return (
    <header className="flex items-center justify-between px-4 py-3">
      <h1 className="text-xl font-bold tracking-tight text-orange-500">
        Pulse
      </h1>
      {onlineCount > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 border border-stone-800 px-2.5 py-1">
          <span
            className="h-2 w-2 rounded-full bg-green-500"
            aria-hidden="true"
          />
          <span className="text-xs text-stone-300">
            {onlineCount} online
          </span>
        </span>
      )}
    </header>
  );
}
