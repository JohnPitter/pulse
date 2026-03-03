import { useState, useMemo } from "react";
import { Search, Plus, Settings, Columns2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Agent } from "../../stores/agents";
import { AgentSidebarItem } from "./AgentSidebarItem";

interface AgentSidebarProps {
  agents: Agent[];
  selectedAgentId: string | null;
  secondAgentId: string | null;
  splitMode: boolean;
  onSelectAgent: (id: string) => void;
  onCreateAgent: () => void;
  onToggleSplit: () => void;
}

interface StatusGroup {
  label: string;
  agents: Agent[];
  color: string;
}

function groupAgents(agents: Agent[], query: string): StatusGroup[] {
  const q = query.toLowerCase().trim();
  const filtered = q
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.projectPath.toLowerCase().includes(q),
      )
    : agents;

  const active: Agent[] = [];
  const needInput: Agent[] = [];
  const done: Agent[] = [];
  const stopped: Agent[] = [];

  for (const agent of filtered) {
    if (agent.status === "running") {
      active.push(agent);
    } else if (agent.status === "waiting") {
      needInput.push(agent);
    } else if (agent.lastMessage) {
      done.push(agent);
    } else {
      stopped.push(agent);
    }
  }

  const groups: StatusGroup[] = [];
  if (active.length > 0) groups.push({ label: "Active", agents: active, color: "bg-green-500" });
  if (needInput.length > 0) groups.push({ label: "Need Input", agents: needInput, color: "bg-yellow-500" });
  if (done.length > 0) groups.push({ label: "Done", agents: done, color: "bg-blue-500" });
  if (stopped.length > 0) groups.push({ label: "Stopped", agents: stopped, color: "bg-stone-600" });

  return groups;
}

function countByStatus(agents: Agent[]) {
  let active = 0;
  let needInput = 0;
  let done = 0;
  let stopped = 0;
  for (const a of agents) {
    if (a.status === "running") active++;
    else if (a.status === "waiting") needInput++;
    else if (a.lastMessage) done++;
    else stopped++;
  }
  return { active, needInput, done, stopped, total: agents.length };
}

export function AgentSidebar({
  agents,
  selectedAgentId,
  secondAgentId,
  splitMode,
  onSelectAgent,
  onCreateAgent,
  onToggleSplit,
}: AgentSidebarProps) {
  const [search, setSearch] = useState("");

  const groups = useMemo(() => groupAgents(agents, search), [agents, search]);
  const counts = useMemo(() => countByStatus(agents), [agents]);

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-[#0d0d14] border-r border-white/5">
      {/* Header: brand + actions */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <span className="text-[15px] font-semibold text-white tracking-tight">
            Pulse
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleSplit}
            aria-label={splitMode ? "Single view" : "Split view"}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ${
              splitMode
                ? "bg-orange-500/10 text-orange-400"
                : "text-stone-500 hover:bg-white/[0.05] hover:text-stone-300"
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onCreateAgent}
            aria-label="Create new agent"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-all duration-200 hover:bg-orange-500/10 hover:text-orange-400 active:scale-[0.95]"
          >
            <Plus className="h-4 w-4" />
          </button>
          <Link
            to="/settings"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 transition-all duration-200 hover:bg-white/[0.05] hover:text-stone-300"
            aria-label="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Status indicators */}
      {agents.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-[11px] tabular-nums text-stone-500">{counts.active}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
            <span className="text-[11px] tabular-nums text-stone-500">{counts.needInput}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="text-[11px] tabular-nums text-stone-500">{counts.done}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-600" />
            <span className="text-[11px] tabular-nums text-stone-500">{counts.stopped}</span>
          </div>
          <span className="ml-auto text-[10px] text-stone-700">{counts.total} total</span>
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full rounded-lg border border-white/5 bg-white/[0.03] py-1.5 pl-8 pr-3 text-[13px] text-stone-300 placeholder-stone-600 outline-none transition-all duration-200 focus-visible:border-orange-500/30 focus-visible:ring-1 focus-visible:ring-orange-500/20"
          />
        </div>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-xs text-stone-600">
              {agents.length === 0 ? "No agents yet" : "No matches"}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <div className="flex items-center justify-between px-2.5 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${group.color}`} />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-stone-600">
                    {group.label}
                  </span>
                </div>
                <span className="text-[10px] tabular-nums text-stone-700">
                  {group.agents.length}
                </span>
              </div>
              <div className="space-y-0.5">
                {group.agents.map((agent) => (
                  <AgentSidebarItem
                    key={agent.id}
                    agent={agent}
                    selected={agent.id === selectedAgentId || agent.id === secondAgentId}
                    onSelect={onSelectAgent}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
