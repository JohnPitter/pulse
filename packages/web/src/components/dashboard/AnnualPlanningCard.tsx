import type { Task } from "../../stores/tasks";

interface Props {
  tasks: Task[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function AnnualPlanningCard({ tasks }: Props) {
  const year = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed

  const tasksByMonth = MONTHS.map((_, i) => {
    return tasks.filter((t) => {
      const d = new Date(t.createdAt);
      return d.getFullYear() === year && d.getMonth() === i;
    }).length;
  });

  const completedByMonth = MONTHS.map((_, i) => {
    return tasks.filter((t) => {
      const d = new Date(t.updatedAt);
      return t.status === "completed" && d.getFullYear() === year && d.getMonth() === i;
    }).length;
  });

  const maxVal = Math.max(...tasksByMonth, 1);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[13px] font-semibold text-text-primary">Annual planning</span>
          <span className="ml-2 text-[11px] text-text-disabled">{year}</span>
        </div>
        <span className="text-[11px] text-text-disabled border border-border rounded-lg px-2 py-0.5">
          Year timeline
        </span>
      </div>

      {/* Month columns */}
      <div className="flex-1 flex flex-col justify-end gap-1">
        <div className="flex items-end gap-1 h-14">
          {MONTHS.map((month, i) => {
            const height = tasksByMonth[i] > 0 ? Math.max((tasksByMonth[i] / maxVal) * 100, 8) : 4;
            const isCurrent = i === currentMonth;
            return (
              <div key={month} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className={`w-full rounded-t-sm transition-all ${isCurrent ? "bg-orange" : completedByMonth[i] > 0 ? "bg-blue/60" : "bg-border-strong"}`}
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Month labels */}
        <div className="flex gap-1">
          {MONTHS.map((month, i) => (
            <div key={month} className={`flex-1 text-center text-[8px] font-medium ${i === currentMonth ? "text-orange" : "text-text-disabled"}`}>
              {month.slice(0, 1)}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-orange" />
            <span className="text-[9px] text-text-disabled">Current</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-blue/60" />
            <span className="text-[9px] text-text-disabled">Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-border-strong" />
            <span className="text-[9px] text-text-disabled">Planned</span>
          </div>
        </div>
      </div>
    </div>
  );
}
