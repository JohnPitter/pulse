import { useState, useMemo } from "react";
import { Search, Plus, Settings, Columns2, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Agent } from "../../stores/agents";
import { useAuthStore } from "../../stores/auth";
import { AgentSidebarItem } from "./AgentSidebarItem";

interface AgentSidebarProps {
  agents: Agent[];
  selectedAgentId: string | null;
  secondAgentId: string | null;
  splitMode: boolean;
  onSelectAgent: (id: string) => void;
  onCreateAgent: () => void;
  onToggleSplit: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
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
  if (active.length > 0) groups.push({ label: "Active", agents: active, color: "bg-success" });
  if (needInput.length > 0) groups.push({ label: "Need Input", agents: needInput, color: "bg-warning" });
  if (done.length > 0) groups.push({ label: "Done", agents: done, color: "bg-info" });
  if (stopped.length > 0) groups.push({ label: "Stopped", agents: stopped, color: "bg-neutral-fg3" });

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
  mobileOpen,
  onCloseMobile,
}: AgentSidebarProps) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const groups = useMemo(() => groupAgents(agents, search), [agents, search]);
  const counts = useMemo(() => countByStatus(agents), [agents]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-neutral-bg2 border-r border-stroke shadow-16
      transform transition-transform duration-300 ease-in-out
      md:relative md:z-auto md:border md:rounded-2xl md:shadow-2 md:shrink-0 md:transform-none md:transition-none
      ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}>
      {/* Header: brand + actions */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-stroke">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand" />
          <span className="text-[15px] font-semibold text-neutral-fg1 tracking-tight">
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
                ? "bg-brand-light text-brand"
                : "text-neutral-fg3 hover:bg-neutral-bg-hover hover:text-neutral-fg2"
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onCreateAgent}
            aria-label="Create new agent"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-fg2 transition-all duration-200 hover:bg-brand-light hover:text-brand active:scale-[0.95]"
          >
            <Plus className="h-4 w-4" />
          </button>
          <Link
            to="/settings"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-fg3 transition-all duration-200 hover:bg-neutral-bg-hover hover:text-neutral-fg2"
            aria-label="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-fg3 transition-all duration-200 hover:bg-neutral-bg-hover hover:text-danger"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Status indicators */}
      {agents.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-stroke">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <span className="text-[11px] tabular-nums text-neutral-fg3">{counts.active}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            <span className="text-[11px] tabular-nums text-neutral-fg3">{counts.needInput}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-info" />
            <span className="text-[11px] tabular-nums text-neutral-fg3">{counts.done}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-fg3" />
            <span className="text-[11px] tabular-nums text-neutral-fg3">{counts.stopped}</span>
          </div>
          <span className="ml-auto text-[10px] text-neutral-fg-disabled">{counts.total} total</span>
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-fg-disabled" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="input-fluent w-full py-1.5 pl-8 pr-3 text-[13px]"
          />
        </div>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-xs text-neutral-fg-disabled">
              {agents.length === 0 ? "No agents yet" : "No matches"}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <div className="flex items-center justify-between px-2.5 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${group.color}`} />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-fg3">
                    {group.label}
                  </span>
                </div>
                <span className="text-[10px] tabular-nums text-neutral-fg-disabled">
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
    </>
  );
}
