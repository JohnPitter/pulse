import { useState, useEffect } from "react";
import { Play, Square, FolderOpen, Brain, Clock } from "lucide-react";
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

const MODEL_BADGE_COLORS: Record<string, string> = {
  haiku: "bg-info/10 text-info",
  sonnet: "bg-brand-light text-brand",
  opus: "bg-purple-light text-purple",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; textColor: string }> = {
  running: { label: "Running", color: "bg-success", textColor: "text-success" },
  waiting: { label: "Waiting", color: "bg-warning", textColor: "text-warning" },
  error:   { label: "Error",   color: "bg-danger",  textColor: "text-danger"  },
  idle:    { label: "Idle",    color: "bg-neutral-fg3", textColor: "text-neutral-fg3" },
  stopped: { label: "Stopped", color: "bg-neutral-fg3", textColor: "text-neutral-fg3" },
};

export function AgentSidebarItem({ agent, selected, onSelect }: AgentSidebarItemProps) {
  const isRunning = agent.status === "running" || agent.status === "waiting";
  const statusCfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.stopped;
  const modelBadgeColor = MODEL_BADGE_COLORS[agent.model] ?? "bg-neutral-bg3 text-neutral-fg3";
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
    }, 10_000);
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
      className={`group relative flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left cursor-pointer transition-all duration-150 ${
        selected
          ? "bg-brand-light/60 border border-brand/30 shadow-xs"
          : "border border-transparent hover:bg-neutral-bg3 hover:border-stroke"
      }`}
    >
      {/* Status dot */}
      <span className="relative inline-flex shrink-0 mt-1.5">
        {(agent.status === "running" || agent.status === "waiting") && (
          <span className={`absolute inline-flex h-2 w-2 rounded-full ${statusCfg.color} opacity-60 ${agent.status === "running" ? "animate-ping" : "animate-pulse"}`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${statusCfg.color}`} />
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Row 1: Name + model badge + thinking */}
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="truncate text-[13px] font-semibold text-neutral-fg1 leading-snug">
            {agent.name}
          </p>
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${modelBadgeColor}`}>
            {MODEL_LABELS[agent.model] ?? agent.model}
          </span>
          {agent.thinkingEnabled === 1 && (
            <Brain className="h-3 w-3 shrink-0 text-purple" />
          )}
        </div>

        {/* Row 2: Status label + elapsed */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[10px] font-medium ${statusCfg.textColor}`}>
            {statusCfg.label}
          </span>
          {elapsed && (
            <>
              <span className="text-neutral-fg3 text-[10px]">·</span>
              <span className="flex items-center gap-0.5 text-[10px] text-neutral-fg3 tabular-nums">
                <Clock className="h-2.5 w-2.5" />
                {elapsed}
              </span>
            </>
          )}
        </div>

        {/* Row 3: Last message or project path */}
        {agent.lastMessage ? (
          <p className="mt-0.5 truncate text-[11px] text-neutral-fg3 leading-relaxed">
            {agent.lastMessage}
          </p>
        ) : (
          <div className="flex items-center gap-1 mt-0.5">
            <FolderOpen className="h-3 w-3 shrink-0 text-neutral-fg-disabled" />
            <p className="truncate text-[11px] text-neutral-fg-disabled">
              {agent.projectPath.split("/").pop() || agent.projectPath}
            </p>
          </div>
        )}
      </div>

      {/* Play/Stop button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isRunning ? "Stop agent" : "Start agent"}
        className={`shrink-0 self-center rounded-lg p-1 opacity-0 transition-all duration-150 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand/50 ${
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
