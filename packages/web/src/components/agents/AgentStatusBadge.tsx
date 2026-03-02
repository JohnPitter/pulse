interface AgentStatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  running: { color: "bg-green-500", label: "Running" },
  waiting: { color: "bg-yellow-500", label: "Waiting" },
  error: { color: "bg-red-500", label: "Error" },
};

const DEFAULT_STATUS = { color: "bg-stone-500", label: "Idle" };

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? DEFAULT_STATUS;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-2 w-2 rounded-full ${config.color}`}
        aria-hidden="true"
      />
      <span className="text-xs text-stone-400">{config.label}</span>
    </span>
  );
}
