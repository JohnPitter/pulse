import { useState } from "react";
import { Plus, Settings, LogOut, Cpu } from "lucide-react";
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

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg bg-neutral-fg1 px-2.5 py-1.5 text-[12px] font-medium text-white shadow-8 pointer-events-none">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-neutral-fg1" />
        </div>
      )}
    </div>
  );
}

export function AgentSidebar({
  agents,
  selectedAgentId,
  secondAgentId,
  onSelectAgent,
  onCreateAgent,
  mobileOpen,
  onCloseMobile,
}: AgentSidebarProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col items-center py-4 gap-2
          bg-white border-r border-stroke w-[72px] shrink-0
          transform transition-transform duration-300 ease-in-out
          md:relative md:z-auto md:transform-none md:transition-none
          md:rounded-2xl md:shadow-[0_6px_20px_rgba(0,0,0,0.05)] md:border
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand shrink-0">
          <Cpu className="h-5 w-5 text-white" />
        </div>

        <div className="w-8 h-px bg-stroke my-1" />

        {/* Create agent button */}
        <Tooltip label="New Agent">
          <button
            type="button"
            onClick={onCreateAgent}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-fg3 hover:bg-neutral-bg3 hover:text-brand transition-all duration-150 active:scale-[0.95]"
            aria-label="Create new agent"
          >
            <Plus className="h-5 w-5" />
          </button>
        </Tooltip>

        {agents.length > 0 && <div className="w-8 h-px bg-stroke my-1" />}

        {/* Agent avatar list */}
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto items-center w-full px-2 pb-2 scrollbar-hide">
          {agents.map((agent) => (
            <AgentSidebarItem
              key={agent.id}
              agent={agent}
              selected={agent.id === selectedAgentId || agent.id === secondAgentId}
              onSelect={onSelectAgent}
            />
          ))}
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col items-center gap-1.5 mt-auto">
          <Tooltip label="Settings">
            <Link
              to="/settings"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-fg3 hover:bg-neutral-bg3 hover:text-neutral-fg1 transition-all duration-150"
              aria-label="Settings"
            >
              <Settings className="h-[18px] w-[18px]" />
            </Link>
          </Tooltip>
          <Tooltip label="Sign out">
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-fg3 hover:bg-danger-light hover:text-danger transition-all duration-150"
              aria-label="Logout"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </Tooltip>
        </div>
      </aside>
    </>
  );
}
