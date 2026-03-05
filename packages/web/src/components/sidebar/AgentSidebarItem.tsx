import { useState } from "react";
import type { Agent } from "../../stores/agents";

interface AgentSidebarItemProps {
  agent: Agent;
  selected: boolean;
  onSelect: (id: string) => void;
}

const AVATAR_COLORS = [
  "#FF9A3C",
  "#4F7DF3",
  "#22C55E",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F59E0B",
  "#EF4444",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + hash * 31;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function AgentSidebarItem({ agent, selected, onSelect }: AgentSidebarItemProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const isRunning = agent.status === "running" || agent.status === "waiting";
  const color = getAvatarColor(agent.name);
  const initial = agent.name.charAt(0).toUpperCase();

  return (
    <div
      className="relative flex"
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      <button
        type="button"
        onClick={() => onSelect(agent.id)}
        aria-label={agent.name}
        className={`relative h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-[15px] transition-all duration-150 active:scale-[0.95] ${
          selected
            ? "ring-2 ring-offset-2 scale-105"
            : "hover:scale-[1.08]"
        }`}
        style={{
          backgroundColor: color,
          ...(selected ? { ringColor: color } as React.CSSProperties : {}),
          boxShadow: selected ? `0 0 0 2px white, 0 0 0 4px ${color}` : undefined,
        }}
      >
        {initial}

        {/* Running indicator */}
        {isRunning && (
          <span className="absolute -top-0.5 -right-0.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
          </span>
        )}
      </button>

      {/* Tooltip */}
      {tooltipVisible && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="whitespace-nowrap rounded-lg bg-neutral-fg1 px-2.5 py-1.5 shadow-8">
            <p className="text-[12px] font-medium text-white">{agent.name}</p>
            <p className="text-[10px] text-neutral-fg3 capitalize mt-0.5">{agent.status ?? "idle"}</p>
          </div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-neutral-fg1" />
        </div>
      )}
    </div>
  );
}
