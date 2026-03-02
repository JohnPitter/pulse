import { useNavigate } from "react-router-dom";
import { Play, Square, FolderOpen } from "lucide-react";
import { AgentStatusBadge } from "./AgentStatusBadge";
import type { Agent } from "../../stores/agents";

interface AgentCardProps {
  agent: Agent;
}

const MODEL_LABELS: Record<string, string> = {
  sonnet: "Sonnet",
  opus: "Opus",
  haiku: "Haiku",
};

const PERMISSION_LABELS: Record<string, string> = {
  bypassPermissions: "Bypass",
  acceptEdits: "Accept Edits",
  plan: "Plan",
  default: "Default",
};

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

export function AgentCard({ agent }: AgentCardProps) {
  const navigate = useNavigate();
  const isRunning = agent.status === "running" || agent.status === "waiting";

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Will be wired to start/stop actions in a future task
  };

  return (
    <button
      type="button"
      onClick={() => navigate(`/agent/${agent.id}`)}
      className="w-full rounded-xl border border-stone-800 bg-stone-900 p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
    >
      {/* Top row: status + name */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <AgentStatusBadge status={agent.status} />
          <span className="text-sm font-semibold tracking-tight text-white truncate">
            {agent.name}
          </span>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isRunning ? "Stop agent" : "Start agent"}
          className="shrink-0 rounded-lg p-1.5 transition-colors duration-200 hover:bg-stone-800"
        >
          {isRunning ? (
            <Square className="h-4 w-4 text-red-400" />
          ) : (
            <Play className="h-4 w-4 text-green-400" />
          )}
        </button>
      </div>

      {/* Project path */}
      <div className="mt-2 flex items-center gap-1.5">
        <FolderOpen className="h-3 w-3 shrink-0 text-stone-500" />
        <span className="text-xs text-stone-500 truncate">
          {agent.projectPath}
        </span>
      </div>

      {/* Badges row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] text-stone-300">
          {MODEL_LABELS[agent.model] ?? agent.model}
        </span>
        {agent.thinkingEnabled === 1 && (
          <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] text-purple-400">
            Thinking
          </span>
        )}
        <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] text-stone-300">
          {PERMISSION_LABELS[agent.permissionMode] ?? agent.permissionMode}
        </span>
      </div>

      {/* Last message preview */}
      {agent.lastMessage && (
        <p className="mt-3 text-xs text-stone-400 line-clamp-2">
          {agent.lastMessage}
        </p>
      )}

      {/* Time ago */}
      {agent.lastActiveAt && (
        <p className="mt-2 text-[11px] text-stone-500">
          {formatTimeAgo(agent.lastActiveAt)}
        </p>
      )}
    </button>
  );
}
