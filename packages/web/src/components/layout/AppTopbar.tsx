import { useLocation, useNavigate } from "react-router-dom";
import { Search, Flag, Bell, ChevronDown } from "lucide-react";
import { useAuthStore } from "../../stores/auth";

const ROUTE_TITLES: Record<string, string> = {
  "/app/dashboard": "General overview",
  "/app/agents":    "Agents",
  "/app/projects":  "Projects",
  "/app/skills":    "Skills & plugins",
  "/app/chat":      "Chat",
  "/app/files":     "Files",
};

export function AppTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const title = ROUTE_TITLES[location.pathname] ?? "General overview";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="flex items-center h-14 px-5 shrink-0 gap-4">
      {/* Title */}
      <h1 className="text-[22px] font-bold text-text-primary tracking-tight whitespace-nowrap mr-4">
        {title}
      </h1>

      {/* Search — centered */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-disabled pointer-events-none" />
          <input
            type="text"
            placeholder="Search in Pulse…"
            className="w-full rounded-full border border-border bg-surface pl-9 pr-4 py-1.5 text-[13px] text-text-primary placeholder-text-disabled focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-blue/10 transition-all"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Report flag */}
        <button
          type="button"
          title="Signal a problem to developers"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-disabled hover:text-text-primary hover:bg-surface-hover transition-all"
        >
          <Flag className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-disabled hover:text-text-primary hover:bg-surface-hover transition-all"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>

        {/* Profile chip */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-2.5 py-1.5 hover:bg-surface-hover transition-all"
        >
          <div className="h-6 w-6 rounded-full bg-orange flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">A</span>
          </div>
          <div className="text-left leading-tight hidden sm:block">
            <p className="text-[12px] font-semibold text-text-primary">Admin</p>
            <p className="text-[10px] text-text-disabled">System user</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-text-disabled ml-0.5" />
        </button>
      </div>
    </header>
  );
}
