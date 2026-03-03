interface StatusDotProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { dot: "h-1.5 w-1.5", ping: "h-1.5 w-1.5" },
  md: { dot: "h-2 w-2", ping: "h-2 w-2" },
  lg: { dot: "h-2.5 w-2.5", ping: "h-2.5 w-2.5" },
} as const;

const STATUS_COLORS: Record<string, string> = {
  running: "bg-success",
  waiting: "bg-warning",
  error: "bg-danger",
  idle: "bg-neutral-fg3",
  stopped: "bg-neutral-fg3",
};

const ANIMATED_STATUSES = new Set(["running", "waiting"]);

export function StatusDot({ status, size = "md" }: StatusDotProps) {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.stopped;
  const sizeClass = SIZE_MAP[size];
  const shouldAnimate = ANIMATED_STATUSES.has(status);

  return (
    <span className="relative inline-flex" aria-hidden="true">
      {shouldAnimate && (
        <span
          className={`absolute inline-flex ${sizeClass.ping} rounded-full ${color} opacity-75 animate-ping`}
        />
      )}
      <span
        className={`relative inline-flex ${sizeClass.dot} rounded-full ${color}`}
      />
    </span>
  );
}
