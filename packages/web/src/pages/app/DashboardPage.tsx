import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Plus,
} from "lucide-react";
import {
  AGENTS,
  AGENTS_ACTIVITY,
  DASHBOARD_BACKLOG,
  DASHBOARD_COMPLETION_TODAY,
  DASHBOARD_STATUS_COUNTS,
  EXECUTIONS,
  PLANNING_YEAR,
} from "./mockData";

const STATUS_BARS = [
  { key: "backlog", label: "Backlog", color: "#D5D2CD" },
  { key: "scheduled", label: "Scheduled", color: "#DFDCD7" },
  { key: "running", label: "Running", color: "#EEA34B" },
  { key: "completed", label: "Completed", color: "#D9DDE4" },
  { key: "failed", label: "Failed", color: "#5E7BE8" },
] as const;

const CARD_CLASS =
  "rounded-[20px] border border-black/6 bg-[#F1EFEC] shadow-[0_8px_18px_rgba(0,0,0,0.06)]";

const ACTIVITY_COLORS: Record<string, string> = {
  Running: "text-warning bg-warning-light",
  Queued: "text-neutral-fg2 bg-neutral-bg3",
  Waiting: "text-neutral-fg2 bg-neutral-bg3",
  Completed: "text-info bg-info-light",
  Failed: "text-danger bg-danger-light",
};

export function DashboardPage() {
  const failedTasks = DASHBOARD_STATUS_COUNTS.failed;
  const backlogOverThreshold = DASHBOARD_STATUS_COUNTS.backlog > 30;
  const agentPoolHealthy = AGENTS.every((agent) => agent.state !== "offline");

  let systemLabel = "System nominal";
  let systemStyle = "text-info bg-info-light";
  if (!agentPoolHealthy && failedTasks > 0) {
    systemLabel = "Degraded";
    systemStyle = "text-danger bg-danger-light";
  } else if (failedTasks > 0 || backlogOverThreshold) {
    systemLabel = "Attention needed";
    systemStyle = "text-warning bg-warning-light";
  }

  const maxBarValue = Math.max(
    ...STATUS_BARS.map((bar) => DASHBOARD_STATUS_COUNTS[bar.key]),
    1,
  );

  const timelineMax = Math.max(...PLANNING_YEAR.months.map((month) => month.planned_tasks), 1);
  const lastExecution = EXECUTIONS[0];

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 xl:min-h-[620px] xl:grid-cols-[0.42fr_0.58fr]">
      <section className={`${CARD_CLASS} flex min-h-0 flex-col overflow-hidden`}>
        <div className="px-4 pb-3 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-neutral-fg1">Backlog</p>
              <p className="text-[11px] text-neutral-fg2">Tasks to schedule</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-stroke bg-neutral-bg2 px-2 py-1 text-[10px] text-neutral-fg2">
              <Clock3 className="h-3 w-3" />
              Live
            </span>
          </div>

          <div className="relative flex h-[280px] items-center justify-center overflow-hidden rounded-[18px] border border-black/5 bg-[linear-gradient(180deg,#ECE9E4,#E6E3DE)] sm:h-[312px]">
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 16px 16px, rgba(0,0,0,0.06) 1.1px, transparent 1.1px)",
                backgroundSize: "20px 20px",
              }}
            />

            <div className="relative h-[224px] w-[170px]">
              <div className="absolute left-1/2 top-[6px] h-[48px] w-[126px] -translate-x-1/2 rounded-[22px] border border-black/8 bg-[#D8D6D1] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]" />
              <div className="absolute left-1/2 top-[30px] h-[160px] w-[150px] -translate-x-1/2 rounded-[28px] border border-black/8 bg-[#BFC5CC] shadow-[inset_0_1px_0_rgba(255,255,255,0.58)]" />
              <div className="absolute left-1/2 top-[48px] h-[123px] w-[102px] -translate-x-1/2 rounded-[18px] border border-black/8 bg-[#F19532]/85" />
              <div className="absolute bottom-[14px] left-1/2 h-[96px] w-[136px] -translate-x-1/2 rounded-[20px] border border-black/10 bg-[#D7D4CF]" />
              <div className="absolute left-1/2 top-[98px] h-[50px] w-[70px] -translate-x-1/2 rounded-[14px] border border-black/8 bg-[#7B858F]" />
            </div>

            <div className="absolute left-4 top-5 rounded-2xl border border-stroke bg-neutral-bg2 px-3 py-2 shadow-xs">
              <p className="text-[10px] text-neutral-fg3">Next due</p>
              <p className="text-[13px] font-semibold text-neutral-fg1">{DASHBOARD_BACKLOG.next_due}</p>
            </div>
            <div className="absolute left-4 bottom-6 rounded-2xl border border-stroke bg-neutral-bg2 px-3 py-2 shadow-xs">
              <p className="text-[10px] text-neutral-fg3">Backlog size</p>
              <p className="text-[13px] font-semibold text-neutral-fg1">{DASHBOARD_BACKLOG.backlog_size} tasks</p>
            </div>
            <div className="absolute right-4 top-7 rounded-2xl border border-stroke bg-neutral-bg2 px-3 py-2 shadow-xs">
              <p className="text-[10px] text-neutral-fg3">Ready to run</p>
              <p className="text-[13px] font-semibold text-brand">{DASHBOARD_BACKLOG.ready_to_run}</p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stroke bg-neutral-bg2 py-2 text-[12px] font-medium text-neutral-fg1 hover:bg-neutral-bg3"
            >
              <Plus className="h-3.5 w-3.5 text-brand" />
              Add task
            </button>
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stroke bg-neutral-bg2 py-2 text-[12px] font-medium text-neutral-fg1 hover:bg-neutral-bg3"
            >
              <Clock3 className="h-3.5 w-3.5 text-info" />
              Schedule
            </button>
          </div>
        </div>

        <div className="mt-auto border-t border-black/5 bg-[#ECE9E4] px-4 pb-4 pt-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[16px] font-semibold leading-tight text-neutral-fg1">Annual planning</p>
              <p className="text-[11px] text-neutral-fg2">Year timeline</p>
            </div>
            <span className="rounded-full border border-stroke bg-neutral-bg2 px-2 py-1 text-[10px] text-neutral-fg2">
              {PLANNING_YEAR.year}
            </span>
          </div>

          <div className="flex h-[92px] items-end gap-1.5 rounded-2xl border border-black/5 bg-[#F3F1EE] px-2 py-2">
            {PLANNING_YEAR.months.map((month, index) => {
              const barHeight = Math.max((month.planned_tasks / timelineMax) * 100, 14);
              const hasMilestone = month.milestones.length > 0;
              return (
                <div key={month.month} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-sm ${
                      hasMilestone ? "bg-info/75" : index === 2 ? "bg-brand" : "bg-[#CFCAC3]"
                    }`}
                    style={{ height: `${barHeight}%` }}
                  />
                  <span className="text-[8px] font-semibold text-neutral-fg3">
                    {String(month.month).padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="flex min-h-0 flex-col gap-3">
        <section className={`${CARD_CLASS} flex min-h-0 flex-col p-4 sm:p-5 xl:min-h-[360px]`}>
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-[38px] font-semibold leading-[0.94] tracking-[-0.03em] text-neutral-fg1 sm:text-[44px] xl:text-[56px]">
                Tasks by status
              </h2>
              <p className="text-[12px] text-neutral-fg2">Overview of current workload</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold ${systemStyle}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {systemLabel}
            </span>
          </div>

          <div className="mt-3 flex min-h-0 flex-col rounded-2xl border border-black/5 bg-[#F3F1EE] p-3 xl:flex-1">
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {STATUS_BARS.map((bar) => {
                const value = DASHBOARD_STATUS_COUNTS[bar.key];
                return (
                  <p key={`${bar.key}-value`} className="text-center text-[24px] font-semibold leading-none text-neutral-fg1 sm:text-[34px]">
                    {value}
                  </p>
                );
              })}
            </div>

            <div className="mt-2 flex h-[118px] items-end gap-2 sm:h-[150px] sm:gap-3">
              {STATUS_BARS.map((bar) => {
                const value = DASHBOARD_STATUS_COUNTS[bar.key];
                const barHeight = Math.max((value / maxBarValue) * 100, 8);
                return (
                  <div key={bar.key} className="flex flex-1 flex-col items-center">
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{ height: `${barHeight}%`, backgroundColor: bar.color }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-1 grid grid-cols-5 gap-2 sm:gap-3">
              {STATUS_BARS.map((bar) => (
                <p key={`${bar.key}-label`} className="text-center text-[10px] font-medium text-neutral-fg3">
                  {bar.label}
                </p>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-3 border-t border-black/5 pt-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] text-neutral-fg3">Completion today</p>
                <p className="text-[38px] font-semibold leading-none text-neutral-fg1 sm:text-[44px]">
                  {DASHBOARD_COMPLETION_TODAY}
                  <span className="text-[24px] text-neutral-fg2">%</span>
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-stroke bg-neutral-bg2 px-3 py-1.5 text-[12px] font-medium text-neutral-fg1 hover:bg-neutral-bg3"
              >
                View report
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>

        <div className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-[0.58fr_0.42fr] xl:h-[252px] xl:min-h-[252px]">
          <section className={`${CARD_CLASS} min-h-[210px] overflow-hidden p-4`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-neutral-fg1 sm:text-[33px]">Agents activity</h3>
              <span className="rounded-full border border-stroke bg-neutral-bg2 px-2 py-1 text-[10px] text-neutral-fg2">
                Live activity feed
              </span>
            </div>

            <div className="space-y-1.5">
              {AGENTS_ACTIVITY.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-neutral-bg2/75"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#5D6375,#353945)] text-[12px] font-semibold text-white">
                    {row.agent_name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-neutral-fg1">{row.agent_name}</p>
                    <p className="truncate text-[11px] text-neutral-fg2">{row.current_task_title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ACTIVITY_COLORS[row.status]}`}>
                      {row.status}
                    </span>
                    {row.status === "Running" ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin text-brand" />
                    ) : row.status === "Completed" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-info" />
                    ) : row.status === "Failed" ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                    ) : (
                      <Clock3 className="h-3.5 w-3.5 text-neutral-fg3" />
                    )}
                    <span className="hidden text-[10px] text-neutral-fg3 sm:inline">{row.relative_time}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className={`${CARD_CLASS} flex min-h-[210px] flex-col overflow-hidden p-4`}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-neutral-fg1 sm:text-[33px]">Last task</h3>
                <p className="text-[11px] text-neutral-fg2">Most recent execution</p>
              </div>
              <span className="rounded-full border border-stroke bg-neutral-bg2 px-2 py-1 text-[10px] text-neutral-fg2">
                Task details · {lastExecution.logs_count} logs
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-neutral-fg3">Task</p>
                <p className="text-[13px] font-semibold text-neutral-fg1">Resumo diário dos agentes</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-neutral-fg3">Agent</p>
                <p className="text-[13px] font-semibold text-neutral-fg1">Nova</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-neutral-fg3">Result</p>
                <p className="text-[13px] font-semibold text-info">Success</p>
              </div>
            </div>

            <div className="mt-auto">
              <div className="mb-3 flex h-[84px] items-center justify-center rounded-2xl border border-black/5 bg-[linear-gradient(180deg,#EEEAE5,#E0DDD8)]">
                <div className="relative h-[54px] w-[54px] rounded-full border border-black/10 bg-[#D4D1CC]">
                  <div className="absolute left-1/2 top-1/2 h-[32px] w-[32px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-brand/75" />
                </div>
              </div>
              <button
                type="button"
                className="w-full rounded-xl border border-stroke bg-neutral-bg2 py-1.5 text-[12px] font-medium text-neutral-fg1 hover:bg-neutral-bg3"
              >
                Open logs
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
