import { NavLink } from "react-router-dom";
import { PulseLogo } from "../brand/PulseLogo";
import { useI18n } from "../../i18n";
import { APP_NAV_ITEMS } from "./appConfig";

export function AppSidebar() {
  const { t } = useI18n();

  return (
    <aside className="flex w-[66px] shrink-0 flex-col items-center border-r border-stroke/80 bg-[#ECEAE7] px-2 py-4 animate-slide-in-left">
      <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl border border-stroke bg-neutral-bg2 shadow-xs">
        <PulseLogo className="h-5 w-5" monochrome />
      </div>

      <nav className="flex w-full flex-1 flex-col items-center gap-2">
        {APP_NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={t(labelKey)}
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
