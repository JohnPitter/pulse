import { Play, Copy, Square, Brain, Pencil, StopCircle } from "lucide-react";
import type { Agent } from "../../stores/agents";

interface TerminalInfoBarProps {
  agent: Agent;
  contextUsage: string | null;
  onToggleAgent: () => void;
  onEditAgent: () => void;
  onDuplicateAgent: () => void;
  onStopAgent: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  running: { color: "bg-success", label: "Running" },
  waiting: { color: "bg-warning", label: "Waiting" },
  error:   { color: "bg-danger",  label: "Error" },
  idle:    { color: "bg-neutral-fg3", label: "Idle" },
  stopped: { color: "bg-neutral-fg3", label: "Stopped" },
};

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

export function TerminalInfoBar({
  agent,
  contextUsage,
  onToggleAgent,
  onEditAgent,
  onDuplicateAgent,
  onStopAgent,
}: TerminalInfoBarProps) {
  const isRunning = agent.status === "running" || agent.status === "waiting";
  const statusCfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.stopped;
  const modelBadge = MODEL_BADGE_COLORS[agent.model] ?? "bg-neutral-bg3 text-neutral-fg3";
  const modelLabel = MODEL_LABELS[agent.model] ?? agent.model;

  return (
    <div className="flex items-center h-[52px] px-4 border-b border-stroke bg-neutral-bg2 shrink-0 gap-3 min-w-0">
      {/* Status dot */}
      <span className="relative inline-flex shrink-0">
        {isRunning && (
          <span
            className={`absolute inline-flex h-2 w-2 rounded-full ${statusCfg.color} opacity-60 ${
              agent.status === "running" ? "animate-ping" : "animate-pulse"
            }`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${statusCfg.color}`} />
      </span>

      {/* Agent name */}
      <span className="text-[15px] font-semibold text-neutral-fg1 truncate tracking-tight">
        {agent.name}
      </span>

      {/* Model badge */}
      <span
        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${modelBadge}`}
      >
        {modelLabel}
      </span>

      {/* Thinking icon */}
      {agent.thinkingEnabled === 1 && (
        <Brain className="h-3.5 w-3.5 text-purple shrink-0" />
      )}

      {/* Context usage pill */}
      {contextUsage && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-bg3 border border-stroke shrink-0">
          <span className="text-[10px] font-medium text-neutral-fg3">ctx</span>
          <span className="text-[11px] font-semibold text-neutral-fg2 tabular-nums">{contextUsage}</span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onToggleAgent}
          aria-label={isRunning ? "Stop agent" : "Start agent"}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-fg3 hover:bg-neutral-bg3 hover:text-neutral-fg1 transition-all duration-150"
        >
          {isRunning ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={onEditAgent}
          aria-label="Edit agent"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-fg3 hover:bg-neutral-bg3 hover:text-neutral-fg1 transition-all duration-150"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDuplicateAgent}
          aria-label="Duplicate agent"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-fg3 hover:bg-neutral-bg3 hover:text-neutral-fg1 transition-all duration-150"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        {isRunning && (
          <button
            type="button"
            onClick={onStopAgent}
            aria-label="Stop agent"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-danger hover:bg-danger-light transition-all duration-150"
          >
            <StopCircle className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
