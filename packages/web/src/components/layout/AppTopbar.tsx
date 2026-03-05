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
import { ROUTE_TITLES } from "./appConfig";

export function AppTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const logout = useAuthStore((s) => s.logout);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [issueMessage, setIssueMessage] = useState("");
  const [issueSent, setIssueSent] = useState(false);

  const title = ROUTE_TITLES[location.pathname] ?? "General overview";
  const searchValue = searchParams.get("q") ?? "";

  const notifications = useMemo(
    () => [
      { id: "n1", text: "Agent Atlas finished nightly summary", time: "2m ago" },
      { id: "n2", text: "Task schedule conflict detected", time: "8m ago" },
      { id: "n3", text: "Files sync completed", time: "21m ago" },
    ],
    [],
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
      <header className="relative flex h-[68px] items-center gap-4 border-b border-stroke/80 px-5">
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
              placeholder="Search in Pulse…"
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
            aria-label="Open notifications panel"
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
            title="Signal a problem to developers"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-neutral-fg2 transition-colors hover:border-stroke hover:bg-neutral-bg2 hover:text-neutral-fg1"
            aria-label="Open report issue modal"
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
            aria-label="Open profile menu"
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
            <div className="absolute right-[162px] top-11 z-30 w-[310px] rounded-2xl border border-stroke bg-neutral-bg2 p-3 shadow-8">
              <p className="mb-2 px-1 text-[11px] font-semibold text-neutral-fg2">Notifications</p>
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
            <div className="absolute right-0 top-11 z-30 w-[188px] rounded-2xl border border-stroke bg-neutral-bg2 p-2 shadow-8">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings");
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] text-neutral-fg2 hover:bg-neutral-bg3 hover:text-neutral-fg1"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] text-neutral-fg2 hover:bg-neutral-bg3 hover:text-neutral-fg1"
              >
                <UserCircle2 className="h-3.5 w-3.5" />
                Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] text-danger hover:bg-danger-light"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {reportOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]">
          <form
            onSubmit={handleReportSubmit}
            className="w-full max-w-md rounded-2xl border border-stroke bg-neutral-bg2 p-5 shadow-16"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-neutral-fg1">Report issue</p>
                <p className="text-[12px] text-neutral-fg3">Signal a problem to developers</p>
              </div>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-lg p-1 text-neutral-fg3 hover:bg-neutral-bg3 hover:text-neutral-fg1"
                aria-label="Close report issue modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              value={issueMessage}
              onChange={(event) => setIssueMessage(event.target.value)}
              placeholder="Describe what happened..."
              rows={5}
              className="w-full rounded-xl border border-stroke bg-neutral-bg3 px-3 py-2 text-[13px] text-neutral-fg1 placeholder:text-neutral-fg3 focus:outline-none focus:ring-2 focus:ring-brand-light"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-lg border border-stroke px-3 py-1.5 text-[12px] text-neutral-fg2 hover:bg-neutral-bg3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-hover"
              >
                {issueSent ? "Sent" : "Send report"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
