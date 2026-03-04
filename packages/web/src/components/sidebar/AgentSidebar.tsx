import { useState, useMemo, useCallback } from "react";
import { Search, Plus, Settings, Columns2, LogOut, Cpu } from "lucide-react";
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
  key: StatusKey;
}

type StatusKey = "active" | "needInput" | "done" | "stopped";

function classifyAgent(agent: Agent): StatusKey {
  if (agent.status === "running") return "active";
  if (agent.status === "waiting") return "needInput";
  if (agent.lastMessage) return "done";
  return "stopped";
}

function groupAgents(agents: Agent[], query: string, filter: Set<StatusKey>): StatusGroup[] {
  const q = query.toLowerCase().trim();
  const filtered = q
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.projectPath.toLowerCase().includes(q),
      )
    : agents;

  const buckets: Record<StatusKey, Agent[]> = {
    active: [],
    needInput: [],
    done: [],
    stopped: [],
  };

  for (const agent of filtered) {
    const key = classifyAgent(agent);
    if (filter.size === 0 || filter.has(key)) {
      buckets[key].push(agent);
    }
  }

  const defs: Array<{ key: StatusKey; label: string; color: string }> = [
    { key: "active", label: "Active", color: "bg-success" },
    { key: "needInput", label: "Need Input", color: "bg-warning" },
    { key: "done", label: "Done", color: "bg-info" },
    { key: "stopped", label: "Stopped", color: "bg-neutral-fg3" },
  ];

  const groups: StatusGroup[] = [];
  for (const def of defs) {
    if (buckets[def.key].length > 0) {
      groups.push({ ...def, agents: buckets[def.key] });
    }
  }
  return groups;
}

function countByStatus(agents: Agent[]) {
  let active = 0;
  let needInput = 0;
  let done = 0;
  let stopped = 0;
  for (const a of agents) {
    const key = classifyAgent(a);
    if (key === "active") active++;
    else if (key === "needInput") needInput++;
    else if (key === "done") done++;
    else stopped++;
  }
  return { active, needInput, done, stopped, total: agents.length };
}

const FILTER_PILLS: Array<{
  key: StatusKey;
  dotBg: string;
}> = [
  { key: "active", dotBg: "bg-success" },
  { key: "needInput", dotBg: "bg-warning" },
  { key: "done", dotBg: "bg-info" },
  { key: "stopped", dotBg: "bg-neutral-fg3" },
];

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
  const [statusFilter, setStatusFilter] = useState<Set<StatusKey>>(new Set());
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const groups = useMemo(() => groupAgents(agents, search, statusFilter), [agents, search, statusFilter]);
  const counts = useMemo(() => countByStatus(agents), [agents]);

  const toggleFilter = useCallback((key: StatusKey) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const countFor = (key: StatusKey) => counts[key];

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
        fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-neutral-bg2 border-r border-stroke
        transform transition-transform duration-300 ease-in-out
        md:relative md:z-auto md:border md:rounded-2xl md:shadow-2 md:shrink-0 md:transform-none md:transition-none
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Header: brand + actions */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-stroke">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold text-neutral-fg1 tracking-tight">Pulse</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleSplit}
              aria-label={splitMode ? "Single view" : "Split view"}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150 ${
                splitMode
                  ? "bg-brand-light text-brand"
                  : "text-neutral-fg3 hover:bg-neutral-bg3 hover:text-neutral-fg1"
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onCreateAgent}
              aria-label="Create new agent"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-fg3 transition-all duration-150 hover:bg-neutral-bg3 hover:text-neutral-fg1 active:scale-[0.95]"
            >
              <Plus className="h-4 w-4" />
            </button>
            <Link
              to="/settings"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-fg3 transition-all duration-150 hover:bg-neutral-bg3 hover:text-neutral-fg1"
              aria-label="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Logout"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-fg3 transition-all duration-150 hover:bg-neutral-bg3 hover:text-danger"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Status filter pills */}
        {agents.length > 0 && (
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-stroke">
            {FILTER_PILLS.map((pill) => {
              const count = countFor(pill.key);
              const isSelected = statusFilter.has(pill.key);
              const isNoFilter = statusFilter.size === 0;
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => toggleFilter(pill.key)}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1 ${
                    isSelected
                      ? "bg-neutral-fg1 text-neutral-bg2"
                      : isNoFilter
                      ? "bg-neutral-bg3 text-neutral-fg2 hover:bg-neutral-bg-hover"
                      : "bg-neutral-bg3/60 text-neutral-fg3 hover:bg-neutral-bg3"
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Filter by ${pill.key}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSelected ? "bg-white" : pill.dotBg}`} />
                  <span className="tabular-nums">{count}</span>
                </button>
              );
            })}
            <span className="ml-auto text-[11px] font-medium tabular-nums text-neutral-fg3">{counts.total} total</span>
          </div>
        )}

        {/* Search */}
        <div className="px-3 py-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-fg3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents..."
              className="w-full rounded-full border border-stroke bg-neutral-bg3 py-1.5 pl-8 pr-4 text-[13px] text-neutral-fg1 placeholder:text-neutral-fg3 outline-none focus:border-brand focus:bg-neutral-bg2 transition-all duration-150"
            />
          </div>
        </div>

        {/* Agent list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-[12px] text-neutral-fg3">
                {agents.length === 0
                  ? "No agents yet"
                  : statusFilter.size > 0
                  ? "No agents match this filter"
                  : "No matches"}
              </p>
              {statusFilter.size > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter(new Set())}
                  className="mt-2 text-[11px] text-brand hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-4">
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-fg3">
                    {group.label}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-fg3 tabular-nums">
                    {group.agents.length}
                  </span>
                </div>
                <div className="space-y-1">
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
