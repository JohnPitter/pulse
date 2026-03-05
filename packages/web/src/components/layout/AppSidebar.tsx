import { NavLink } from "react-router-dom";
import { APP_NAV_ITEMS } from "./appConfig";

function PulseMark() {
  return (
    <div className="relative h-5 w-5">
      <span className="absolute left-0 top-0 h-2 w-2 rotate-45 rounded-[3px] border border-neutral-fg1/70" />
      <span className="absolute left-2.5 top-0.5 h-[2px] w-2.5 rounded-full bg-neutral-fg1/80" />
      <span className="absolute left-2.5 top-[7px] h-[2px] w-2 rounded-full bg-neutral-fg1/80" />
      <span className="absolute left-2.5 top-[12px] h-[2px] w-1.5 rounded-full bg-neutral-fg1/80" />
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="flex w-[66px] shrink-0 flex-col items-center border-r border-stroke/80 bg-[#ECEAE7] px-2 py-4">
      <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl border border-stroke bg-neutral-bg2 shadow-xs">
        <PulseMark />
      </div>

      <nav className="flex w-full flex-1 flex-col items-center gap-2">
        {APP_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `flex h-9 w-9 items-center justify-center rounded-[11px] border transition-all ${
                isActive
                  ? "border-stroke bg-neutral-bg2 text-neutral-fg1 shadow-xs"
                  : "border-transparent text-neutral-fg2 hover:border-stroke hover:bg-neutral-bg2/70 hover:text-neutral-fg1"
              }`
            }
          >
            <Icon className="h-[16px] w-[16px]" />
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
