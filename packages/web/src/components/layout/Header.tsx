import { useAgentsStore } from "../../stores/agents";
import { StatusDot } from "../common/StatusDot";

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
        <span className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-stone-900/80 backdrop-blur-sm px-3 py-1.5">
          <StatusDot status="running" size="sm" />
          <span className="text-xs font-medium text-stone-300">
            {onlineCount} active
          </span>
        </span>
      )}
    </header>
  );
}
