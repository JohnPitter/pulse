import { useEffect, useMemo, useState } from "react";
import { MessageSquare, SendHorizontal, Users } from "lucide-react";
import { useAgentsStore } from "../../stores/agents";
import { useShellQuery } from "./useShellQuery";
import { useI18n } from "../../i18n";

const CARD_CLASS =
  "rounded-[20px] border border-black/6 bg-[#F1EFEC] shadow-[0_8px_18px_rgba(0,0,0,0.06)]";

const AGENT_STATUS_KEY: Record<string, string> = {
  running: "statuses.running",
  offline: "statuses.offline",
  idle: "statuses.idle",
  stopped: "statuses.offline",
};

export function ChatPage() {
  const query = useShellQuery();
  const { t } = useI18n();

  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);

  const [selectedAgentId, setSelectedAgentId] = useState("");

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    if (!selectedAgentId && agents.length > 0) setSelectedAgentId(agents[0].id);
  }, [agents, selectedAgentId]);

  const filteredAgents = useMemo(
    () =>
      agents.filter((agent) => {
        const content = `${agent.name} ${agent.role ?? ""}`.toLowerCase();
        return !query || content.includes(query);
      }),
    [agents, query],
  );

  const selectedAgent =
    filteredAgents.find((a) => a.id === selectedAgentId) ?? filteredAgents[0] ?? null;

  return (
    <div className="grid h-full min-h-[520px] grid-cols-1 gap-3 xl:grid-cols-[0.24fr_0.51fr_0.25fr] animate-fade-in">
      <section className={`${CARD_CLASS} min-h-0 p-4 animate-fade-up stagger-1`}>
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-neutral-fg3" />
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-neutral-fg1">{t("chatPage.agentSelector")}</h2>
            <p className="text-[12px] text-neutral-fg2">{t("chatPage.agentSelectorSubtitle")}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {filteredAgents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => setSelectedAgentId(agent.id)}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
                agent.id === selectedAgent?.id
                  ? "border-brand/35 bg-neutral-bg2"
                  : "border-transparent hover:border-stroke hover:bg-neutral-bg2/75"
              }`}
            >
              <div>
                <p className="text-[12px] font-semibold text-neutral-fg1">{agent.name}</p>
                <p className="text-[10px] text-neutral-fg3">{agent.role}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold capitalize ${
                  agent.status === "running"
                    ? "bg-warning-light text-warning"
                    : agent.status === "offline" || agent.status === "stopped"
                      ? "bg-danger-light text-danger"
                      : "bg-neutral-bg3 text-neutral-fg2"
                }`}
              >
                {t(AGENT_STATUS_KEY[agent.status] ?? agent.status)}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={`${CARD_CLASS} flex min-h-0 flex-col p-4 animate-fade-up stagger-2`}>
        <div className="mb-3">
          <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-neutral-fg1">{t("chatPage.chatPanel")}</h3>
          <p className="text-[12px] text-neutral-fg2">{t("chatPage.chatPanelSubtitle")}</p>
        </div>

        <div className="flex-1 space-y-2 overflow-auto rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
          {selectedAgent ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-[12px] text-neutral-fg3">{t("chatPage.noMessages")}</p>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-[12px] text-neutral-fg3">{t("chatPage.noThreadMatch")}</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-stroke bg-neutral-bg2 px-3 py-2">
          <MessageSquare className="h-4 w-4 text-neutral-fg3" />
          <input
            type="text"
            placeholder={t("chatPage.typeMessage")}
            className="w-full bg-transparent text-[12px] text-neutral-fg1 placeholder:text-neutral-fg3 focus:outline-none"
          />
          <button type="button" className="rounded-lg bg-brand p-1.5 text-white hover:bg-brand-hover">
            <SendHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      <section className={`${CARD_CLASS} min-h-0 p-4 animate-fade-up stagger-3`}>
        <div className="mb-3">
          <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-neutral-fg1">{t("chatPage.threads")}</h3>
          <p className="text-[12px] text-neutral-fg2">{t("chatPage.threadList")}</p>
        </div>

        <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-stroke bg-neutral-bg2/70">
          <p className="text-[12px] text-neutral-fg3">{t("chatPage.noThreadMatch")}</p>
        </div>
      </section>
    </div>
  );
}
