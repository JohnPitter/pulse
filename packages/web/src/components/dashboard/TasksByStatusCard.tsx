import type { TaskStats } from "../../stores/dashboard";

interface Props {
  stats: TaskStats | null;
}

const BAR_CONFIG = [
  { key: "backlog",    label: "Backlog",    color: "#D4D3CF" },
  { key: "scheduled", label: "Scheduled",  color: "#D4D3CF" },
  { key: "running",   label: "Running",    color: "#FF9A3C" },
  { key: "completed", label: "Completed",  color: "#C4C9D4" },
  { key: "failed",    label: "Failed",     color: "#4F7DF3" },
] as const;

export function TasksByStatusCard({ stats }: Props) {
  const counts = stats?.counts ?? {};
  const maxVal = Math.max(...BAR_CONFIG.map((b) => counts[b.key] ?? 0), 1);

  const hasFailures = (counts.failed ?? 0) > 0;
  const systemLabel = hasFailures ? "Attention needed" : "System nominal";
  const systemColor = hasFailures ? "text-warning bg-warning-light" : "text-blue bg-blue-light";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-[22px] font-bold text-text-primary tracking-tight leading-tight">Tasks by status</h2>
          <p className="text-[12px] text-text-disabled mt-0.5">Overview of current workload</p>
        </div>
        <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${systemColor}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {systemLabel}
        </span>
      </div>

      {/* Bar chart */}
      <div className="flex-1 flex flex-col justify-end mt-4">
        <div className="flex items-end gap-4 h-28 mb-2">
          {BAR_CONFIG.map((bar) => {
            const val = counts[bar.key] ?? 0;
            const heightPct = val > 0 ? Math.max((val / maxVal) * 100, 6) : 3;
            return (
              <div key={bar.key} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[13px] font-bold text-text-primary">{val}</span>
                <div
                  className="w-full rounded-t-lg transition-all duration-500"
                  style={{ height: `${heightPct}%`, background: bar.color }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex gap-4">
          {BAR_CONFIG.map((bar) => (
            <div key={bar.key} className="flex-1 text-center text-[10px] text-text-disabled font-medium">
              {bar.label}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div>
          <p className="text-[11px] text-text-disabled">Completion today</p>
          <p className="text-[26px] font-bold text-text-primary leading-tight">
            {stats?.completionRate ?? 0}
            <span className="text-[16px] text-text-secondary font-medium ml-0.5">%</span>
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 text-[12px] font-medium text-text-secondary border border-border rounded-lg px-3 py-1.5 hover:bg-surface-hover transition-all"
        >
          View report ↗
        </button>
      </div>
    </div>
  );
}
