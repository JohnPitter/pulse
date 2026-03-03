import { StatusDot } from "../common/StatusDot";

interface AgentStatusBadgeProps {
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  running: "Running",
  waiting: "Waiting",
  error: "Error",
  idle: "Idle",
  stopped: "Stopped",
};

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const label = STATUS_LABELS[status] ?? "Idle";

  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusDot status={status} size="sm" />
      <span className="text-xs text-neutral-fg2">{label}</span>
    </span>
  );
}
