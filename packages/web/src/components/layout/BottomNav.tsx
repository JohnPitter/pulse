import { useLocation, useNavigate } from "react-router-dom";
import { Home, Settings } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/settings", icon: Settings, label: "Settings" },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-stone-950/90 backdrop-blur-md">
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
