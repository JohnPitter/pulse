import { Play, Square, FolderOpen } from "lucide-react";
import { StatusDot } from "../common/StatusDot";
import type { Agent } from "../../stores/agents";
import { emitEvent } from "../../stores/socket";

interface AgentSidebarItemProps {
  agent: Agent;
  selected: boolean;
  onSelect: (id: string) => void;
}

const MODEL_LABELS: Record<string, string> = {
  sonnet: "Sonnet 4",
  opus: "Opus 4",
  haiku: "Haiku 4",
};

export function AgentSidebarItem({ agent, selected, onSelect }: AgentSidebarItemProps) {
  const isRunning = agent.status === "running" || agent.status === "waiting";

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) {
      emitEvent("agent:stop", { agentId: agent.id });
    } else {
      emitEvent("agent:start", { agentId: agent.id });
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(agent.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(agent.id); }}
      className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left cursor-pointer transition-all duration-150 ${
        selected
          ? "bg-white/[0.07] text-white"
          : "text-stone-400 hover:bg-white/[0.03] hover:text-stone-200"
      }`}
    >
      <StatusDot status={agent.status} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium leading-tight">
          {agent.name}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <FolderOpen className="h-2.5 w-2.5 shrink-0 text-stone-600" />
          <p className="truncate text-[11px] text-stone-600">
            {agent.projectPath.split("/").pop() || agent.projectPath}
          </p>
        </div>
      </div>

      {/* Model badge */}
      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-white/5 text-stone-500">
        {MODEL_LABELS[agent.model] ?? agent.model}
      </span>

      {/* Play/Stop toggle — visible on hover or when selected */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isRunning ? "Stop agent" : "Start agent"}
        className={`shrink-0 rounded-md p-1 opacity-0 transition-all duration-150 group-hover:opacity-100 ${
          selected ? "opacity-100" : ""
        } ${
          isRunning
            ? "text-red-400 hover:bg-red-500/15"
            : "text-green-400 hover:bg-green-500/15"
        }`}
      >
        {isRunning ? (
          <Square className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}
