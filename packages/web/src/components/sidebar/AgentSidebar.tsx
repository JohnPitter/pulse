import { useState, useMemo } from "react";
import { Search, Plus, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import type { Agent } from "../../stores/agents";
import { AgentSidebarItem } from "./AgentSidebarItem";

interface AgentSidebarProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onCreateAgent: () => void;
}

interface StatusGroup {
  label: string;
  agents: Agent[];
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
  const idle: Agent[] = [];
  const stopped: Agent[] = [];

  for (const agent of filtered) {
    if (agent.status === "running" || agent.status === "waiting") {
      active.push(agent);
    } else if (agent.status === "idle") {
      idle.push(agent);
    } else {
      stopped.push(agent);
    }
  }

  const groups: StatusGroup[] = [];
  if (active.length > 0) groups.push({ label: "Active", agents: active });
  if (idle.length > 0) groups.push({ label: "Idle", agents: idle });
  if (stopped.length > 0) groups.push({ label: "Stopped", agents: stopped });

  return groups;
}

export function AgentSidebar({
  agents,
  selectedAgentId,
  onSelectAgent,
  onCreateAgent,
}: AgentSidebarProps) {
  const [search, setSearch] = useState("");

  const groups = useMemo(() => groupAgents(agents, search), [agents, search]);

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-[#0d0d14] border-r border-white/5">
      {/* Logo / brand */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-white/5">
        <div className="h-2 w-2 rounded-full bg-orange-500" />
        <span className="text-[15px] font-semibold text-white tracking-tight">
          Pulse
        </span>
      </div>

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
                <span className="text-[11px] font-medium uppercase tracking-wider text-stone-600">
                  {group.label}
                </span>
                <span className="text-[10px] tabular-nums text-stone-700">
                  {group.agents.length}
                </span>
              </div>
              <div className="space-y-0.5">
                {group.agents.map((agent) => (
                  <AgentSidebarItem
                    key={agent.id}
                    agent={agent}
                    selected={agent.id === selectedAgentId}
                    onSelect={onSelectAgent}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom actions */}
      <div className="border-t border-white/5 px-3 py-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onCreateAgent}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2 text-[13px] font-semibold text-white transition-all duration-200 hover:bg-orange-600 active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          New Agent
        </button>
        <Link
          to="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition-colors duration-200 hover:bg-white/[0.05] hover:text-stone-300"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}
