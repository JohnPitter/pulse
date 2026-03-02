import { useLocation, useNavigate } from "react-router-dom";
import { Home, BarChart3, Settings } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/stats", icon: BarChart3, label: "Stats" },
  { path: "/settings", icon: Settings, label: "Settings" },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-800 bg-stone-950/95 backdrop-blur-sm">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors duration-200 ${
                isActive ? "text-orange-500" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
