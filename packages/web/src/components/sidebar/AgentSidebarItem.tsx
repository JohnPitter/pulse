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
  "#10B981",
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
  const [tip, setTip] = useState(false);
  const isRunning = agent.status === "running" || agent.status === "waiting";
  const color = getAvatarColor(agent.name);
  const initial = agent.name.charAt(0).toUpperCase();

  return (
    <div
      className="relative flex"
      onMouseEnter={() => setTip(true)}
      onMouseLeave={() => setTip(false)}
    >
      <button
        type="button"
        onClick={() => onSelect(agent.id)}
        aria-label={agent.name}
        className={`relative h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-[14px] transition-all duration-150 focus:outline-none ${
          selected
            ? "scale-105 ring-2 ring-offset-2"
            : "hover:scale-[1.06] opacity-75 hover:opacity-100"
        }`}
        style={{
          backgroundColor: color,
          boxShadow: selected ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : undefined,
        }}
      >
        {initial}

        {/* Status ring */}
        {isRunning && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success border border-white" />
          </span>
        )}

        {/* Selected indicator */}
        {selected && !isRunning && (
          <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-orange" />
        )}
      </button>

      {tip && (
        <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-text-primary rounded-lg px-2.5 py-2 shadow-lg">
            <p className="text-[12px] font-semibold text-white whitespace-nowrap">{agent.name}</p>
            <p className="text-[10px] text-text-disabled capitalize mt-0.5">{agent.status ?? "idle"}</p>
          </div>
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-text-primary" />
        </div>
      )}
    </div>
  );
}
