import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Bot, FolderKanban, Puzzle, MessageSquare, Archive,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/agents",    icon: Bot,             label: "Agents" },
  { to: "/app/projects",  icon: FolderKanban,    label: "Projects" },
  { to: "/app/skills",    icon: Puzzle,          label: "Skills & Plugins" },
  { to: "/app/chat",      icon: MessageSquare,   label: "Chat" },
  { to: "/app/files",     icon: Archive,         label: "Files" },
] as const;

export function AppSidebar() {
  return (
    <aside className="flex flex-col items-center py-4 gap-1 w-[60px] shrink-0">
      {/* Logo mark */}
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange mb-3 shrink-0">
        <span className="text-[14px] font-bold text-white">P</span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150 ${
                isActive
                  ? "bg-text-primary text-white"
                  : "text-text-disabled hover:bg-surface-hover hover:text-text-primary"
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" />
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
