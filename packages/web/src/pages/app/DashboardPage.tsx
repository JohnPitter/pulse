import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Plus,
  Loader2,
  X,
} from "lucide-react";
import { useI18n } from "../../i18n";
import { useDashboardStore } from "../../stores/dashboard";
import { useAgentsStore } from "../../stores/agents";
import { useTasksStore, type TaskStatus, type TaskPriority } from "../../stores/tasks";

const STATUS_KEYS: TaskStatus[] = ["backlog", "scheduled", "running", "completed", "failed"];

const STATUS_BARS = [
  { key: "backlog" as const, labelKey: "dashboard.backlog", color: "#D5D2CD" },
  { key: "scheduled" as const, labelKey: "dashboard.schedule", color: "#DFDCD7" },
  { key: "running" as const, labelKey: "statuses.running", color: "#EEA34B" },
  { key: "completed" as const, labelKey: "statuses.completed", color: "#D9DDE4" },
  { key: "failed" as const, labelKey: "statuses.failed", color: "#5E7BE8" },
] as const;

const CARD_CLASS =
  "rounded-[20px] border border-black/6 bg-[#F1EFEC] shadow-[0_8px_18px_rgba(0,0,0,0.06)]";

const ACTIVITY_COLORS: Record<string, string> = {
  running: "text-warning bg-warning-light",
  idle: "text-neutral-fg2 bg-neutral-bg3",
  offline: "text-neutral-fg2 bg-neutral-bg3",
  completed: "text-info bg-info-light",
  failed: "text-danger bg-danger-light",
};

const STATUS_TRANSLATION_KEY: Record<string, string> = {
  running: "statuses.running",
  idle: "statuses.idle",
  offline: "statuses.offline",
  completed: "statuses.completed",
  failed: "statuses.failed",
};

export function DashboardPage() {
  const { t } = useI18n();

  const dashboardLoading = useDashboardStore((s) => s.loading);
  const stats = useDashboardStore((s) => s.stats);
  const lastExecution = useDashboardStore((s) => s.lastExecution);
  const fetchDashboard = useDashboardStore((s) => s.fetch);

  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);

  const tasks = useTasksStore((s) => s.tasks);
  const fetchTasks = useTasksStore((s) => s.fetchTasks);
  const createTask = useTasksStore((s) => s.createTask);
  const updateTask = useTasksStore((s) => s.updateTask);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchAgents();
    fetchTasks();
  }, [fetchDashboard, fetchAgents, fetchTasks]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { backlog: 0, scheduled: 0, running: 0, completed: 0, failed: 0 };
    if (stats?.counts) {
      for (const key of STATUS_KEYS) {
        counts[key] = stats.counts[key] ?? 0;
      }
    }
    return counts;
  }, [stats]);

  const completionRate = stats?.completionRate ?? 0;

  const failedCount = statusCounts.failed;
  const backlogOverThreshold = statusCounts.backlog > 30;
  const agentPoolHealthy = agents.every((a) => a.status !== "offline");

  let systemLabel = t("dashboard.systemNominal");
  let systemStyle = "text-info bg-info-light";
  if (!agentPoolHealthy && failedCount > 0) {
    systemLabel = t("dashboard.degraded");
    systemStyle = "text-danger bg-danger-light";
  } else if (failedCount > 0 || backlogOverThreshold) {
    systemLabel = t("dashboard.attentionNeeded");
    systemStyle = "text-warning bg-warning-light";
  }

  const maxBarValue = Math.max(...STATUS_BARS.map((bar) => statusCounts[bar.key]), 1);

  const backlogTasks = tasks.filter((t) => t.status === "backlog");
  const scheduledTasks = tasks.filter((t) => t.status === "scheduled");
  const nextDue = tasks
    .filter((t) => t.dueAt && t.status !== "completed" && t.status !== "failed")
    .sort((a, b) => (a.dueAt! < b.dueAt! ? -1 : 1))[0];
  const nextDueLabel = nextDue?.dueAt
    ? new Date(nextDue.dueAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "\u2014";

  const lastAgent = lastExecution ? agents.find((a) => a.id === lastExecution.agentId) : null;

  // Annual timeline: group tasks by month
  const monthNames = t("dashboard.monthNames").split(",");
  const currentYear = new Date().getFullYear();
  const tasksByMonth = useMemo(() => {
    const months: { month: string; count: number; completed: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const tasksInMonth = tasks.filter((task) => {
        const date = task.dueAt ?? task.scheduledAt ?? task.createdAt;
        if (!date) return false;
        const d = new Date(date);
        return d.getFullYear() === currentYear && d.getMonth() === m;
      });
      months.push({
        month: monthNames[m] ?? String(m + 1),
        count: tasksInMonth.length,
        completed: tasksInMonth.filter((t) => t.status === "completed").length,
      });
    }
    return months;
  }, [tasks, currentYear, monthNames]);

  const maxMonthCount = Math.max(...tasksByMonth.map((m) => m.count), 1);

  if (dashboardLoading && !stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-fg3" />
      </div>
    );
  }

  return (
    <>
      <div className="grid h-full min-h-0 grid-cols-1 gap-3 xl:min-h-[620px] xl:grid-cols-[0.42fr_0.58fr] animate-fade-in">
        <section className={`${CARD_CLASS} flex min-h-0 flex-col overflow-hidden animate-fade-up stagger-1`}>
          <div className="px-4 pb-3 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-neutral-fg1">{t("dashboard.backlog")}</p>
                <p className="text-[11px] text-neutral-fg2">{t("dashboard.tasksToSchedule")}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-stroke bg-neutral-bg2 px-2 py-1 text-[10px] text-neutral-fg2">
                <Clock3 className="h-3 w-3" />
                {t("dashboard.liveActivityFeed")}
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

              <svg viewBox="0 0 320 224" className="relative h-[224px] w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Connection lines */}
                <line x1="60" y1="56" x2="130" y2="90" stroke="#C8C4BE" strokeWidth="1.5" opacity="0.6" />
                <line x1="60" y1="56" x2="130" y2="140" stroke="#C8C4BE" strokeWidth="1.5" opacity="0.4" />
                <line x1="60" y1="112" x2="130" y2="90" stroke="#C8C4BE" strokeWidth="1.5" opacity="0.5" />
                <line x1="60" y1="112" x2="130" y2="140" stroke="#C8C4BE" strokeWidth="1.5" opacity="0.6" />
                <line x1="60" y1="168" x2="130" y2="140" stroke="#C8C4BE" strokeWidth="1.5" opacity="0.5" />
                <line x1="60" y1="168" x2="130" y2="90" stroke="#C8C4BE" strokeWidth="1.5" opacity="0.3" />
                <line x1="130" y1="90" x2="200" y2="70" stroke="#EEA34B" strokeWidth="1.8" opacity="0.7" />
                <line x1="130" y1="90" x2="200" y2="130" stroke="#EEA34B" strokeWidth="1.8" opacity="0.5" />
                <line x1="130" y1="140" x2="200" y2="130" stroke="#EEA34B" strokeWidth="1.8" opacity="0.7" />
                <line x1="130" y1="140" x2="200" y2="70" stroke="#EEA34B" strokeWidth="1.8" opacity="0.4" />
                <line x1="130" y1="140" x2="200" y2="180" stroke="#EEA34B" strokeWidth="1.8" opacity="0.5" />
                <line x1="200" y1="70" x2="262" y2="112" stroke="#C8C4BE" strokeWidth="1.5" opacity="0.6" />
                <line x1="200" y1="130" x2="262" y2="112" stroke="#C8C4BE" strokeWidth="1.5" opacity="0.6" />
                <line x1="200" y1="180" x2="262" y2="112" stroke="#C8C4BE" strokeWidth="1.5" opacity="0.4" />

                {/* Pulse animation lines */}
                <line x1="130" y1="90" x2="200" y2="70" stroke="#F19532" strokeWidth="2" opacity="0.9">
                  <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2.4s" repeatCount="indefinite" />
                </line>
                <line x1="130" y1="140" x2="200" y2="130" stroke="#F19532" strokeWidth="2" opacity="0.9">
                  <animate attributeName="opacity" values="0.2;0.9;0.2" dur="2.4s" repeatCount="indefinite" />
                </line>

                {/* Input layer neurons */}
                <circle cx="60" cy="56" r="10" fill="#D5D2CD" stroke="#B8B4AE" strokeWidth="1.5" />
                <circle cx="60" cy="112" r="10" fill="#D5D2CD" stroke="#B8B4AE" strokeWidth="1.5" />
                <circle cx="60" cy="168" r="10" fill="#D5D2CD" stroke="#B8B4AE" strokeWidth="1.5" />

                {/* Hidden layer neurons */}
                <circle cx="130" cy="90" r="13" fill="#F19532" stroke="#D97E1F" strokeWidth="1.5" opacity="0.9">
                  <animate attributeName="r" values="13;14.5;13" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle cx="130" cy="140" r="13" fill="#F19532" stroke="#D97E1F" strokeWidth="1.5" opacity="0.85">
                  <animate attributeName="r" values="13;14.5;13" dur="2.4s" begin="0.6s" repeatCount="indefinite" />
                </circle>

                {/* Second hidden layer */}
                <circle cx="200" cy="70" r="11" fill="#BFC5CC" stroke="#A0A6AD" strokeWidth="1.5" />
                <circle cx="200" cy="130" r="11" fill="#BFC5CC" stroke="#A0A6AD" strokeWidth="1.5" />
                <circle cx="200" cy="180" r="9" fill="#BFC5CC" stroke="#A0A6AD" strokeWidth="1.5" opacity="0.7" />

                {/* Output neuron */}
                <circle cx="262" cy="112" r="14" fill="#4F7DF3" stroke="#3D61B3" strokeWidth="1.5" opacity="0.85">
                  <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="262" cy="112" r="6" fill="white" opacity="0.3" />
              </svg>

              <div className="absolute left-4 top-5 rounded-2xl border border-stroke bg-neutral-bg2 px-3 py-2 shadow-xs">
                <p className="text-[10px] text-neutral-fg3">{t("dashboard.nextDue")}</p>
                <p className="text-[13px] font-semibold text-neutral-fg1">{nextDueLabel}</p>
              </div>
              <div className="absolute left-4 bottom-6 rounded-2xl border border-stroke bg-neutral-bg2 px-3 py-2 shadow-xs">
                <p className="text-[10px] text-neutral-fg3">{t("dashboard.backlogSize")}</p>
                <p className="text-[13px] font-semibold text-neutral-fg1">
                  {backlogTasks.length} {t("dashboard.tasksSuffix")}
                </p>
              </div>
              <div className="absolute right-4 top-7 rounded-2xl border border-stroke bg-neutral-bg2 px-3 py-2 shadow-xs">
                <p className="text-[10px] text-neutral-fg3">{t("dashboard.readyToRun")}</p>
                <p className="text-[13px] font-semibold text-brand">{scheduledTasks.length}</p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stroke bg-neutral-bg2 py-2 text-[12px] font-medium text-neutral-fg1 hover:bg-neutral-bg3 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-brand" />
                {t("dashboard.addTask")}
              </button>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(true)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stroke bg-neutral-bg2 py-2 text-[12px] font-medium text-neutral-fg1 hover:bg-neutral-bg3 transition-colors"
              >
                <Clock3 className="h-3.5 w-3.5 text-info" />
                {t("dashboard.schedule")}
              </button>
            </div>
          </div>
        </section>

        <div className="flex min-h-0 flex-col gap-3">
          {/* Annual Planning Timeline */}
          <section className={`${CARD_CLASS} p-4 animate-fade-up stagger-2`}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-neutral-fg1">{t("dashboard.annualPlanning")}</h3>
                <p className="text-[11px] text-neutral-fg2">{t("dashboard.yearTimeline")} {currentYear}</p>
              </div>
              <Calendar className="h-4 w-4 text-neutral-fg3" />
            </div>
            <div className="flex items-end gap-1.5">
              {tasksByMonth.map((m, i) => {
                const barH = Math.max((m.count / maxMonthCount) * 48, 4);
                const completedH = m.count > 0 ? (m.completed / m.count) * barH : 0;
                const isCurrentMonth = new Date().getMonth() === i;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="relative flex h-[52px] w-full items-end justify-center">
                      <div
                        className="w-full rounded-t-md bg-[#D5D2CD] transition-all"
                        style={{ height: `${barH}px` }}
                      >
                        {completedH > 0 && (
                          <div
                            className="absolute bottom-0 left-0 w-full rounded-t-md bg-brand/70"
                            style={{ height: `${completedH}px` }}
                          />
                        )}
                      </div>
                    </div>
                    <p className={`text-[9px] ${isCurrentMonth ? "font-bold text-brand" : "text-neutral-fg3"}`}>
                      {m.month}
                    </p>
                    {m.count > 0 && (
                      <p className="text-[8px] text-neutral-fg2">{m.count}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className={`${CARD_CLASS} flex min-h-0 flex-col p-4 sm:p-5 xl:min-h-[300px] animate-fade-up stagger-3`}>
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-[38px] font-semibold leading-[0.94] tracking-[-0.03em] text-neutral-fg1 sm:text-[44px] xl:text-[56px]">
                  {t("dashboard.tasksByStatus")}
                </h2>
                <p className="text-[12px] text-neutral-fg2">{t("dashboard.workloadOverview")}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold ${systemStyle}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {systemLabel}
              </span>
            </div>

            <div className="mt-3 flex min-h-0 flex-col rounded-2xl border border-black/5 bg-[#F3F1EE] p-3 xl:flex-1">
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {STATUS_BARS.map((bar) => (
                  <p key={`${bar.key}-value`} className="text-center text-[24px] font-semibold leading-none text-neutral-fg1 sm:text-[34px]">
                    {statusCounts[bar.key]}
                  </p>
                ))}
              </div>

              <div className="mt-2 flex h-[118px] items-end gap-2 sm:h-[150px] sm:gap-3">
                {STATUS_BARS.map((bar) => {
                  const value = statusCounts[bar.key];
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
                    {t(bar.labelKey)}
                  </p>
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-3 border-t border-black/5 pt-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] text-neutral-fg3">{t("dashboard.completionToday")}</p>
                  <p className="text-[38px] font-semibold leading-none text-neutral-fg1 sm:text-[44px]">
                    {Math.round(completionRate)}
                    <span className="text-[24px] text-neutral-fg2">%</span>
                  </p>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-stroke bg-neutral-bg2 px-3 py-1.5 text-[12px] font-medium text-neutral-fg1 hover:bg-neutral-bg3"
                >
                  {t("dashboard.viewReport")}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </section>

          <div className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-[0.58fr_0.42fr] xl:h-[252px] xl:min-h-[252px]">
            <section className={`${CARD_CLASS} min-h-[210px] overflow-hidden p-4 animate-fade-up stagger-4`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-neutral-fg1 sm:text-[33px]">{t("dashboard.agentsActivity")}</h3>
                <span className="rounded-full border border-stroke bg-neutral-bg2 px-2 py-1 text-[10px] text-neutral-fg2">
                  {t("dashboard.liveActivityFeed")}
                </span>
              </div>

              {agents.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-neutral-fg3">{t("dashboard.noAgents")}</p>
              ) : (
                <div className="space-y-1.5">
                  {agents.slice(0, 5).map((agent) => {
                    const agentTask = tasks.find((t) => t.agentId === agent.id && (t.status === "running" || t.status === "scheduled"));
                    return (
                      <div
                        key={agent.id}
                        className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-neutral-bg2/75"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#5D6375,#353945)] text-[12px] font-semibold text-white">
                          {agent.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-neutral-fg1">{agent.name}</p>
                          <p className="truncate text-[11px] text-neutral-fg2">
                            {agentTask?.title ?? agent.role ?? "\u2014"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ACTIVITY_COLORS[agent.status] ?? "text-neutral-fg2 bg-neutral-bg3"}`}>
                            {t(STATUS_TRANSLATION_KEY[agent.status] ?? agent.status)}
                          </span>
                          {agent.status === "running" ? (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin text-brand" />
                          ) : agent.status === "offline" ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                          ) : (
                            <Clock3 className="h-3.5 w-3.5 text-neutral-fg3" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className={`${CARD_CLASS} flex min-h-[210px] flex-col overflow-hidden p-4 animate-fade-up stagger-5`}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-neutral-fg1 sm:text-[33px]">{t("dashboard.lastTask")}</h3>
                  <p className="text-[11px] text-neutral-fg2">{t("dashboard.mostRecentExecution")}</p>
                </div>
                {lastExecution && (
                  <span className="rounded-full border border-stroke bg-neutral-bg2 px-2 py-1 text-[10px] text-neutral-fg2">
                    {t("dashboard.taskDetails")} - {lastExecution.logsCount} {t("dashboard.logs")}
                  </span>
                )}
              </div>

              {lastExecution ? (
                <>
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-neutral-fg3">{t("dashboard.task")}</p>
                      <p className="text-[13px] font-semibold text-neutral-fg1">{lastExecution.task?.title ?? "\u2014"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-neutral-fg3">{t("dashboard.agent")}</p>
                      <p className="text-[13px] font-semibold text-neutral-fg1">{lastAgent?.name ?? "\u2014"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-neutral-fg3">{t("dashboard.result")}</p>
                      <p className={`text-[13px] font-semibold ${lastExecution.result === "success" ? "text-info" : "text-danger"}`}>
                        {lastExecution.result === "success" ? t("dashboard.success") : t("statuses.failed")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="mb-3 flex h-[84px] items-center justify-center rounded-2xl border border-black/5 bg-[linear-gradient(180deg,#EEEAE5,#E0DDD8)]">
                      <svg viewBox="0 0 180 60" className="h-[48px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="24" y1="30" x2="66" y2="16" stroke="#C8C4BE" strokeWidth="1.2" />
                        <line x1="24" y1="30" x2="66" y2="44" stroke="#C8C4BE" strokeWidth="1.2" />
                        <line x1="66" y1="16" x2="114" y2="30" stroke="#EEA34B" strokeWidth="1.5" opacity="0.8" />
                        <line x1="66" y1="44" x2="114" y2="30" stroke="#EEA34B" strokeWidth="1.5" opacity="0.8" />
                        <line x1="114" y1="30" x2="156" y2="30" stroke="#4F7DF3" strokeWidth="1.5" opacity="0.7" />
                        <circle cx="24" cy="30" r="6" fill="#D5D2CD" stroke="#B8B4AE" strokeWidth="1" />
                        <circle cx="66" cy="16" r="7" fill="#F19532" stroke="#D97E1F" strokeWidth="1" />
                        <circle cx="66" cy="44" r="7" fill="#F19532" stroke="#D97E1F" strokeWidth="1" />
                        <circle cx="114" cy="30" r="8" fill="#BFC5CC" stroke="#A0A6AD" strokeWidth="1" />
                        <circle cx="156" cy="30" r="8" fill="#4F7DF3" stroke="#3D61B3" strokeWidth="1" />
                        <circle cx="156" cy="30" r="3.5" fill="white" opacity="0.3" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      className="w-full rounded-xl border border-stroke bg-neutral-bg2 py-1.5 text-[12px] font-medium text-neutral-fg1 hover:bg-neutral-bg3"
                    >
                      {t("dashboard.openLogs")}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-[12px] text-neutral-fg3">{t("dashboard.noExecutions")}</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {addModalOpen && (
        <AddTaskModal
          onClose={() => setAddModalOpen(false)}
          onCreate={async (payload) => {
            const task = await createTask(payload);
            if (task) {
              setAddModalOpen(false);
              fetchDashboard();
            }
          }}
        />
      )}

      {scheduleModalOpen && (
        <ScheduleTaskModal
          backlogTasks={backlogTasks}
          onClose={() => setScheduleModalOpen(false)}
          onSchedule={async (taskId, scheduledAt) => {
            const result = await updateTask(taskId, { scheduledAt, status: "scheduled" });
            if (result) {
              setScheduleModalOpen(false);
              fetchDashboard();
            }
          }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Add Task Modal
// ---------------------------------------------------------------------------

function AddTaskModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (payload: { title: string; priority: TaskPriority; dueAt?: string }) => Promise<void>;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueAt, setDueAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    await onCreate({ title: title.trim(), priority, dueAt: dueAt || undefined });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-stroke bg-neutral-bg2 p-5 shadow-16 animate-fade-up"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[15px] font-semibold text-neutral-fg1">{t("dashboard.addTaskTitle")}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-fg3 hover:bg-neutral-bg3 hover:text-neutral-fg1"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="task-title" className="mb-1 block text-[12px] font-medium text-neutral-fg2">
              {t("dashboard.taskTitle")}
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("dashboard.taskTitlePlaceholder")}
              className="w-full rounded-xl border border-stroke bg-neutral-bg3 px-3 py-2 text-[13px] text-neutral-fg1 placeholder:text-neutral-fg3 focus:outline-none focus:ring-2 focus:ring-brand-light"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="task-priority" className="mb-1 block text-[12px] font-medium text-neutral-fg2">
              {t("dashboard.priority")}
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-xl border border-stroke bg-neutral-bg3 px-3 py-2 text-[13px] text-neutral-fg1 focus:outline-none focus:ring-2 focus:ring-brand-light"
            >
              <option value="low">{t("dashboard.priorityLow")}</option>
              <option value="medium">{t("dashboard.priorityMedium")}</option>
              <option value="high">{t("dashboard.priorityHigh")}</option>
            </select>
          </div>

          <div>
            <label htmlFor="task-due" className="mb-1 block text-[12px] font-medium text-neutral-fg2">
              {t("dashboard.dueDate")}
            </label>
            <input
              id="task-due"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full rounded-xl border border-stroke bg-neutral-bg3 px-3 py-2 text-[13px] text-neutral-fg1 focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stroke px-3 py-1.5 text-[12px] text-neutral-fg2 hover:bg-neutral-bg3"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {submitting ? t("dashboard.creating") : t("dashboard.create")}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schedule Task Modal
// ---------------------------------------------------------------------------

function ScheduleTaskModal({
  backlogTasks,
  onClose,
  onSchedule,
}: {
  backlogTasks: { id: string; title: string }[];
  onClose: () => void;
  onSchedule: (taskId: string, scheduledAt: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [selectedTaskId, setSelectedTaskId] = useState(backlogTasks[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !scheduledAt || submitting) return;
    setSubmitting(true);
    await onSchedule(selectedTaskId, new Date(scheduledAt).toISOString());
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-stroke bg-neutral-bg2 p-5 shadow-16 animate-fade-up"
      >
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[15px] font-semibold text-neutral-fg1">{t("dashboard.scheduleTaskTitle")}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-fg3 hover:bg-neutral-bg3 hover:text-neutral-fg1"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-[12px] text-neutral-fg2">{t("dashboard.scheduleTaskSubtitle")}</p>

        {backlogTasks.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-neutral-fg3">{t("dashboard.noBacklogTasks")}</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="schedule-task" className="mb-1 block text-[12px] font-medium text-neutral-fg2">
                {t("dashboard.selectTask")}
              </label>
              <select
                id="schedule-task"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full rounded-xl border border-stroke bg-neutral-bg3 px-3 py-2 text-[13px] text-neutral-fg1 focus:outline-none focus:ring-2 focus:ring-brand-light"
              >
                {backlogTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="schedule-date" className="mb-1 block text-[12px] font-medium text-neutral-fg2">
                {t("dashboard.scheduledFor")}
              </label>
              <input
                id="schedule-date"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-stroke bg-neutral-bg3 px-3 py-2 text-[13px] text-neutral-fg1 focus:outline-none focus:ring-2 focus:ring-brand-light"
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stroke px-3 py-1.5 text-[12px] text-neutral-fg2 hover:bg-neutral-bg3"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={!selectedTaskId || !scheduledAt || submitting}
            className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {submitting ? t("dashboard.scheduling") : t("dashboard.schedule")}
          </button>
        </div>
      </form>
    </div>
  );
}
