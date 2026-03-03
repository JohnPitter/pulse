import { useNavigate } from "react-router-dom";
import { Play, Square, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "../common/GlassCard";
import { StatusDot } from "../common/StatusDot";
import { Badge } from "../common/Badge";
import type { Agent } from "../../stores/agents";
import { emitEvent } from "../../stores/socket";

interface AgentCardProps {
  agent: Agent;
  index?: number;
}

const MODEL_LABELS: Record<string, string> = {
  sonnet: "Sonnet",
  opus: "Opus",
  haiku: "Haiku",
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

export function AgentCard({ agent, index = 0 }: AgentCardProps) {
  const navigate = useNavigate();
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <GlassCard
        hover
        onClick={() => navigate(`/agent/${agent.id}`)}
        className="w-full p-4 text-left"
      >
        {/* Top row: status dot + name + toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <StatusDot status={agent.status} size="md" />
            <span className="text-sm font-semibold tracking-tight text-white truncate">
              {agent.name}
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            aria-label={isRunning ? "Stop agent" : "Start agent"}
            className={`shrink-0 rounded-lg p-1.5 transition-all duration-200 ${
              isRunning
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
            }`}
          >
            {isRunning ? (
              <Square className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
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
          <Badge variant="orange">
            {MODEL_LABELS[agent.model] ?? agent.model}
          </Badge>
          {agent.thinkingEnabled === 1 && (
            <Badge variant="purple">Thinking</Badge>
          )}
        </div>

        {/* Last message preview */}
        {agent.lastMessage && (
          <p className="mt-3 text-xs text-stone-400 line-clamp-2">
            {agent.lastMessage}
          </p>
        )}

        {/* Time ago */}
        {agent.lastActiveAt && (
          <p className="mt-2 text-[11px] text-stone-600">
            {formatTimeAgo(agent.lastActiveAt)}
          </p>
        )}
      </GlassCard>
    </motion.div>
  );
}
