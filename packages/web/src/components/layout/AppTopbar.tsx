import { FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  FileText,
  Flag,
  Search,
  Settings,
  UserCircle2,
  LogOut,
  X,
} from "lucide-react";
import { useAuthStore } from "../../stores/auth";
import { useI18n } from "../../i18n";
import { LanguageSwitcher } from "../common/LanguageSwitcher";
import { ROUTE_TITLE_KEYS } from "./appConfig";

export function AppTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const logout = useAuthStore((s) => s.logout);
  const { t } = useI18n();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [issueMessage, setIssueMessage] = useState("");
  const [issueSent, setIssueSent] = useState(false);

  const title = t(ROUTE_TITLE_KEYS[location.pathname] ?? "routes.generalOverview");
  const searchValue = searchParams.get("q") ?? "";

  const notifications = useMemo(
    () => [
      { id: "n1", text: t("topbar.notificationsItems.n1"), time: t("topbar.timeAgo2m") },
      { id: "n2", text: t("topbar.notificationsItems.n2"), time: t("topbar.timeAgo8m") },
      { id: "n3", text: t("topbar.notificationsItems.n3"), time: t("topbar.timeAgo21m") },
    ],
    [t],
  );

  const handleSearchChange = (nextValue: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextValue.trim()) {
      nextParams.set("q", nextValue);
    } else {
      nextParams.delete("q");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleReportSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!issueMessage.trim()) return;
    setIssueSent(true);
    setTimeout(() => {
      setIssueSent(false);
      setIssueMessage("");
      setReportOpen(false);
    }, 850);
  };

  return (
    <>
      <header className="relative flex h-[68px] items-center gap-4 border-b border-stroke/80 px-5 animate-fade-in">
        <h1 className="min-w-fit text-[26px] font-semibold leading-none tracking-[-0.035em] text-neutral-fg1 sm:text-[30px] lg:text-[40px]">
          {title}
        </h1>

        <div className="flex flex-1 justify-center px-4">
          <label className="relative w-full max-w-[286px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-fg3" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder={t("topbar.searchPlaceholder")}
              className="h-[34px] w-full rounded-full border border-stroke bg-neutral-bg2 pl-9 pr-4 text-[12px] text-neutral-fg1 shadow-xs placeholder:text-neutral-fg3 focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
          </label>
        </div>

        <div className="relative ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
              setProfileOpen(false);
            }}
            className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-neutral-fg2 transition-colors hover:border-stroke hover:bg-neutral-bg2 hover:text-neutral-fg1"
            aria-label={t("topbar.notifications")}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
          </button>

          <button
            type="button"
            onClick={() => {
              setReportOpen(true);
              setNotificationsOpen(false);
              setProfileOpen(false);
            }}
            title={t("topbar.reportIssueTooltip")}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-neutral-fg2 transition-colors hover:border-stroke hover:bg-neutral-bg2 hover:text-neutral-fg1"
            aria-label={t("topbar.reportIssueTitle")}
          >
            <Flag className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 rounded-full border border-stroke bg-neutral-bg2 px-2.5 py-1.5 shadow-xs transition-colors hover:bg-neutral-bg3"
            aria-label={t("topbar.profile")}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#d5a36a,#a26f35)] text-[10px] font-semibold text-white">
              NT
            </div>
            <div className="hidden text-left leading-tight sm:block">
              <p className="text-[11px] font-semibold text-neutral-fg1">Nikita Topson</p>
              <p className="text-[10px] text-neutral-fg3">Material Yield Analyst</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-neutral-fg3" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-[162px] top-11 z-30 w-[310px] rounded-2xl border border-stroke bg-neutral-bg2 p-3 shadow-8 animate-fade-up">
              <p className="mb-2 px-1 text-[11px] font-semibold text-neutral-fg2">{t("topbar.notifications")}</p>
              <div className="space-y-1.5">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-xl border border-stroke/80 bg-neutral-bg3 px-3 py-2"
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-3.5 w-3.5 text-info" />
                      <div>
                        <p className="text-[12px] text-neutral-fg1">{notification.text}</p>
                        <p className="text-[10px] text-neutral-fg3">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profileOpen && (
            <div className="absolute right-0 top-11 z-30 w-[236px] rounded-2xl border border-stroke bg-neutral-bg2 p-2 shadow-8 animate-fade-up">
              <div className="mb-2 rounded-xl border border-stroke/80 bg-neutral-bg3 px-2 py-2">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-neutral-fg3">
                  {t("topbar.languageSelectorLabel")}
                </p>
                <LanguageSwitcher compact className="w-full justify-between" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings");
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] text-neutral-fg2 hover:bg-neutral-bg3 hover:text-neutral-fg1"
              >
                <Settings className="h-3.5 w-3.5" />
                {t("topbar.settings")}
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] text-neutral-fg2 hover:bg-neutral-bg3 hover:text-neutral-fg1"
              >
                <UserCircle2 className="h-3.5 w-3.5" />
                {t("topbar.profile")}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] text-danger hover:bg-danger-light"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t("topbar.signOut")}
              </button>
            </div>
          )}
        </div>
      </header>

      {reportOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]">
          <form
            onSubmit={handleReportSubmit}
            className="w-full max-w-md rounded-2xl border border-stroke bg-neutral-bg2 p-5 shadow-16 animate-fade-up"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-neutral-fg1">{t("topbar.reportIssueTitle")}</p>
                <p className="text-[12px] text-neutral-fg3">{t("topbar.reportIssueSubtitle")}</p>
              </div>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-lg p-1 text-neutral-fg3 hover:bg-neutral-bg3 hover:text-neutral-fg1"
                aria-label={t("common.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              value={issueMessage}
              onChange={(event) => setIssueMessage(event.target.value)}
              placeholder={t("topbar.reportIssuePlaceholder")}
              rows={5}
              className="w-full rounded-xl border border-stroke bg-neutral-bg3 px-3 py-2 text-[13px] text-neutral-fg1 placeholder:text-neutral-fg3 focus:outline-none focus:ring-2 focus:ring-brand-light"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-lg border border-stroke px-3 py-1.5 text-[12px] text-neutral-fg2 hover:bg-neutral-bg3"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-hover"
              >
                {issueSent ? t("topbar.sent") : t("topbar.sendReport")}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
