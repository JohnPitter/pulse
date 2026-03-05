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

function IconButton({
  label,
  children,
  onClick,
  className = "",
  as: Tag = "button",
  to,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  as?: React.ElementType;
  to?: string;
}) {
  const [tip, setTip] = useState(false);

  const props: Record<string, unknown> = {
    className: `relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue ${className}`,
    onMouseEnter: () => setTip(true),
    onMouseLeave: () => setTip(false),
    "aria-label": label,
  };

  if (Tag === "button") {
    props.type = "button";
    props.onClick = onClick;
  } else if (Tag === Link) {
    props.to = to;
  }

  return (
    <Tag {...props}>
      {children}
      {tip && (
        <span className="pointer-events-none absolute left-full ml-2.5 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-text-primary px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg">
          {label}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-text-primary" />
        </span>
      )}
    </Tag>
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
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col items-center py-3 gap-1
          bg-surface border-r border-border w-[72px] shrink-0
          transform transition-transform duration-250 ease-in-out
          md:relative md:z-auto md:transform-none md:transition-none
          md:rounded-2xl md:shadow-[var(--shadow-card)] md:border
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange shrink-0 mb-1">
          <Cpu className="h-[18px] w-[18px] text-white" />
        </div>

        <div className="w-8 h-px bg-border my-1" />

        {/* New agent */}
        <IconButton
          label="New Agent"
          onClick={onCreateAgent}
          className="text-text-disabled hover:bg-surface-muted hover:text-text-primary"
        >
          <Plus className="h-4 w-4" />
        </IconButton>

        {agents.length > 0 && <div className="w-8 h-px bg-border my-1" />}

        {/* Agent list */}
        <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto items-center w-full px-2 scrollbar-hide">
          {agents.map((agent) => (
            <AgentSidebarItem
              key={agent.id}
              agent={agent}
              selected={agent.id === selectedAgentId || agent.id === secondAgentId}
              onSelect={onSelectAgent}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-1 mt-auto pt-2">
          <IconButton
            label="Settings"
            as={Link}
            to="/settings"
            className="text-text-disabled hover:bg-surface-muted hover:text-text-primary"
          >
            <Settings className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Sign out"
            onClick={handleLogout}
            className="text-text-disabled hover:bg-danger-light hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
          </IconButton>
        </div>
      </aside>
    </>
  );
}
