import { StatusDot } from "../common/StatusDot";
import type { Agent } from "../../stores/agents";

interface TerminalInfoBarProps {
  agent: Agent;
  contextUsage: string | null;
}

const MODEL_LABELS: Record<string, string> = {
  sonnet: "Sonnet 4",
  opus: "Opus 4",
  haiku: "Haiku 4",
};

export function TerminalInfoBar({ agent, contextUsage }: TerminalInfoBarProps) {
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
      </div>

      {/* Right: context usage */}
      {contextUsage && (
        <span className="shrink-0 text-[11px] font-mono text-stone-500">
          {contextUsage}
        </span>
      )}
    </div>
  );
}
