import { useState, useEffect } from "react";
import { Play, Square, FolderOpen, Brain } from "lucide-react";
import { StatusDot } from "../common/StatusDot";
import type { Agent } from "../../stores/agents";
import { emitEvent } from "../../stores/socket";
import { formatElapsedTime } from "../../lib/format-time";

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
  const [elapsed, setElapsed] = useState(() =>
    agent.startedAt && isRunning ? formatElapsedTime(agent.startedAt) : "",
  );

  useEffect(() => {
    if (!agent.startedAt || !isRunning) {
      setElapsed("");
      return;
    }
    setElapsed(formatElapsedTime(agent.startedAt));
    const timer = setInterval(() => {
      setElapsed(formatElapsedTime(agent.startedAt!));
    }, 30_000);
    return () => clearInterval(timer);
  }, [agent.startedAt, isRunning]);

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
          ? "bg-brand-light text-neutral-fg1"
          : "text-neutral-fg2 hover:bg-neutral-bg-hover hover:text-neutral-fg1"
      }`}
    >
      <StatusDot status={agent.status} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-medium leading-tight">
            {agent.name}
          </p>
          <span className="shrink-0 rounded px-1 py-px text-[9px] font-medium bg-neutral-bg3 text-neutral-fg3">
            {MODEL_LABELS[agent.model] ?? agent.model}
          </span>
          {agent.thinkingEnabled === 1 && (
            <Brain className="h-2.5 w-2.5 shrink-0 text-purple" />
          )}
        </div>

        {/* Last message / activity */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {agent.lastMessage ? (
            <p className="truncate text-[11px] text-neutral-fg3">
              {agent.lastMessage}
            </p>
          ) : (
            <div className="flex items-center gap-1">
              <FolderOpen className="h-2.5 w-2.5 shrink-0 text-neutral-fg-disabled" />
              <p className="truncate text-[11px] text-neutral-fg-disabled">
                {agent.projectPath.split("/").pop() || agent.projectPath}
              </p>
            </div>
          )}
          {elapsed && (
            <span className="shrink-0 text-[10px] text-neutral-fg-disabled tabular-nums">
              {elapsed}
            </span>
          )}
        </div>
      </div>

      {/* Status badge for waiting agents */}
      {agent.status === "waiting" && (
        <span className="shrink-0 badge badge-warning text-[9px] font-semibold">
          Input
        </span>
      )}

      {/* Play/Stop toggle — visible on hover or when selected */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isRunning ? "Stop agent" : "Start agent"}
        className={`shrink-0 rounded-md p-1 opacity-0 transition-all duration-150 group-hover:opacity-100 ${
          selected ? "opacity-100" : ""
        } ${
          isRunning
            ? "text-danger hover:bg-danger-light"
            : "text-success hover:bg-success-light"
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
