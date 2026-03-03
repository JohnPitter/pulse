import { Play, Pause, Copy, Square, Brain, Pencil } from "lucide-react";
import { StatusDot } from "../common/StatusDot";
import type { Agent } from "../../stores/agents";

interface TerminalInfoBarProps {
  agent: Agent;
  contextUsage: string | null;
  onToggleAgent: () => void;
  onEditAgent: () => void;
  onDuplicateAgent: () => void;
  onStopAgent: () => void;
}

const MODEL_LABELS: Record<string, string> = {
  sonnet: "Sonnet 4",
  opus: "Opus 4",
  haiku: "Haiku 4",
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

  return (
    <div className="flex h-10 items-center justify-between border-b border-white/5 bg-stone-900/60 px-4">
      {/* Left: status + name + model */}
      <div className="flex items-center gap-2.5 min-w-0">
        <StatusDot status={agent.status} size="sm" />
        <span className="text-[13px] font-semibold text-white truncate">
          {agent.name}
        </span>
        <span className="text-stone-700">&middot;</span>
        <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-stone-400">
          {MODEL_LABELS[agent.model] ?? agent.model}
        </span>
        {agent.thinkingEnabled === 1 && (
          <>
            <span className="text-stone-700">&middot;</span>
            <span className="flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-400">
              <Brain className="h-3 w-3" />
              Thinking
            </span>
          </>
        )}
        {contextUsage && (
          <>
            <span className="text-stone-700">&middot;</span>
            <span className="text-[11px] font-mono text-stone-500">
              {contextUsage}
            </span>
          </>
        )}
      </div>

      {/* Right: agent controls */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Play / Pause */}
        <button
          type="button"
          onClick={onToggleAgent}
          aria-label={isRunning ? "Pause agent" : "Start agent"}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150 ${
            isRunning
              ? "text-orange-400 hover:bg-orange-500/10"
              : "text-green-400 hover:bg-green-500/10"
          }`}
        >
          {isRunning ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Edit */}
        <button
          type="button"
          onClick={onEditAgent}
          aria-label="Edit agent"
          className="flex h-7 w-7 items-center justify-center rounded-md text-stone-500 transition-all duration-150 hover:bg-white/5 hover:text-stone-300"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        {/* Duplicate */}
        <button
          type="button"
          onClick={onDuplicateAgent}
          aria-label="Duplicate agent"
          className="flex h-7 w-7 items-center justify-center rounded-md text-stone-500 transition-all duration-150 hover:bg-white/5 hover:text-stone-300"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>

        {/* Stop */}
        <button
          type="button"
          onClick={onStopAgent}
          aria-label="Stop agent"
          disabled={!isRunning}
          className="flex h-7 w-7 items-center justify-center rounded-md text-red-400 transition-all duration-150 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <Square className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
