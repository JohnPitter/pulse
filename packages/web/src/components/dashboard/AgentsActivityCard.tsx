import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import type { Agent } from "../../stores/agents";

interface Props {
  agents: Agent[];
}

function getAvatarColor(name: string): string {
  const colors = ["#FF9A3C", "#4F7DF3", "#10B981", "#8B5CF6", "#EC4899", "#14B8A6"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return colors[Math.abs(hash) % colors.length];
}

function StatusIcon({ status }: { status: string }) {
  if (status === "running" || status === "waiting") return <Loader2 className="h-4 w-4 text-orange animate-spin" />;
  if (status === "idle" || status === "stopped") return <CheckCircle2 className="h-4 w-4 text-blue" />;
  return <AlertCircle className="h-4 w-4 text-danger" />;
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function AgentsActivityCard({ agents }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[16px] font-bold text-text-primary">Agents activity</h3>
        <span className="text-[11px] font-medium text-text-secondary border border-border rounded-lg px-2 py-0.5">
          {agents.length} total
        </span>
      </div>

      <div className="flex flex-col gap-0 flex-1 overflow-y-auto">
        {agents.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[12px] text-text-disabled">No agents created yet</p>
          </div>
        ) : (
          agents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => navigate("/app/chat")}
              className="flex items-center gap-3 py-2.5 hover:bg-surface-hover rounded-xl px-2 -mx-2 transition-all text-left w-full"
            >
              {/* Avatar */}
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-[13px] shrink-0"
                style={{ backgroundColor: getAvatarColor(agent.name) }}
              >
                {agent.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-text-primary truncate">{agent.name}</p>
                <p className="text-[11px] text-text-disabled truncate">
                  {agent.lastMessage ?? "No recent activity"}
                </p>
              </div>

              {/* Status + time */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <StatusIcon status={agent.status} />
                {agent.lastActiveAt && (
                  <span className="text-[10px] text-text-disabled">{formatTimeAgo(agent.lastActiveAt)}</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
