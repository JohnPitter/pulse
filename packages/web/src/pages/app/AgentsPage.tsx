import { useMemo, useState } from "react";
import { ChevronRight, Cpu, Radio, UserRound } from "lucide-react";
import { AGENTS, TASKS } from "./mockData";
import { useShellQuery } from "./useShellQuery";
import { useI18n } from "../../i18n";

const CARD_CLASS =
  "rounded-[20px] border border-black/6 bg-[#F1EFEC] shadow-[0_8px_18px_rgba(0,0,0,0.06)]";

const STATE_BADGES: Record<string, string> = {
  running: "bg-warning-light text-warning",
  idle: "bg-neutral-bg3 text-neutral-fg2",
  offline: "bg-danger-light text-danger",
};

const STATE_KEYS: Record<string, string> = {
  running: "statuses.running",
  idle: "statuses.idle",
  offline: "statuses.offline",
};

export function AgentsPage() {
  const query = useShellQuery();
  const [selectedId, setSelectedId] = useState(AGENTS[0]?.id ?? "");
  const { t } = useI18n();

  const filteredAgents = useMemo(
    () =>
      AGENTS.filter((agent) => {
        const haystack = `${agent.name} ${agent.role}`.toLowerCase();
        return !query || haystack.includes(query);
      }),
    [query],
  );

  const selectedAgent =
    filteredAgents.find((agent) => agent.id === selectedId) ?? filteredAgents[0] ?? null;
  const selectedTask = TASKS.find((task) => task.id === selectedAgent?.current_task_id) ?? null;

  return (
    <div className="grid h-full min-h-[520px] grid-cols-1 gap-3 xl:grid-cols-[0.62fr_0.38fr] animate-fade-in">
      <section className={`${CARD_CLASS} min-h-0 p-4 animate-fade-up stagger-1`}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-neutral-fg1">{t("routes.agents")}</h2>
            <p className="text-[12px] text-neutral-fg2">{t("agentsPage.tableOrCards")}</p>
          </div>
          <span className="rounded-full border border-stroke bg-neutral-bg2 px-2.5 py-1 text-[10px] text-neutral-fg2">
            {t("agentsPage.recordsActive", { count: filteredAgents.length })}
          </span>
        </div>

        <div className="space-y-1.5">
          {filteredAgents.map((agent) => {
            const task = TASKS.find((candidate) => candidate.id === agent.current_task_id);
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedId(agent.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                  agent.id === selectedAgent?.id
                    ? "border-brand/35 bg-neutral-bg2"
                    : "border-transparent hover:border-stroke hover:bg-neutral-bg2/75"
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(140deg,#4F5466,#272B34)] text-[12px] font-semibold text-white">
                  {agent.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-neutral-fg1">{agent.name}</p>
                  <p className="truncate text-[11px] text-neutral-fg2">{task?.title ?? t("agentsPage.noActiveTask")}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATE_BADGES[agent.state]}`}>
                  {t(STATE_KEYS[agent.state] ?? agent.state)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={`${CARD_CLASS} flex min-h-0 flex-col p-4 animate-fade-up stagger-2`}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-neutral-fg1">{t("agentsPage.detail")}</h3>
            <p className="text-[12px] text-neutral-fg2">{t("agentsPage.detailDrawer")}</p>
          </div>
          <Cpu className="h-4 w-4 text-neutral-fg3" />
        </div>

        {selectedAgent ? (
          <div className="flex h-full flex-col gap-3">
            <div className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white">
                  {selectedAgent.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-neutral-fg1">{selectedAgent.name}</p>
                  <p className="text-[11px] text-neutral-fg2">{selectedAgent.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-fg2">
                <Radio className="h-3.5 w-3.5" />
                {t("agentsPage.lastSeen", {
                  time: new Date(selectedAgent.last_seen_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
              <p className="mb-1 text-[10px] uppercase tracking-wide text-neutral-fg3">{t("agentsPage.currentTask")}</p>
              <p className="text-[13px] font-semibold text-neutral-fg1">{selectedTask?.title ?? t("agentsPage.noTaskRunning")}</p>
              <p className="mt-1 text-[11px] text-neutral-fg2">
                {t("agentsPage.status")}: <span className="capitalize">{t(STATE_KEYS[selectedAgent.state] ?? selectedAgent.state)}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
              <p className="mb-2 text-[10px] uppercase tracking-wide text-neutral-fg3">{t("agentsPage.quickActions")}</p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-stroke bg-neutral-bg2 px-3 py-2 text-[12px] text-neutral-fg1 hover:bg-neutral-bg3"
                >
                  {t("agentsPage.openTimeline")}
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-fg3" />
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-stroke bg-neutral-bg2 px-3 py-2 text-[12px] text-neutral-fg1 hover:bg-neutral-bg3"
                >
                  {t("agentsPage.assignTasks")}
                  <UserRound className="h-3.5 w-3.5 text-neutral-fg3" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-stroke bg-neutral-bg2/70">
            <p className="text-[12px] text-neutral-fg3">{t("agentsPage.noMatch")}</p>
          </div>
        )}
      </section>
    </div>
  );
}
