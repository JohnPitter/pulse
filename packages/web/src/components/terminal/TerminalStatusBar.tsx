import { useState, useEffect } from "react";
import { useAuthStore } from "../../stores/auth";
import { formatElapsedTime } from "../../lib/format-time";

interface TerminalStatusBarProps {
  cliVersion: string | null;
}

export function TerminalStatusBar({ cliVersion }: TerminalStatusBarProps) {
  const loginTime = useAuthStore((s) => s.loginTime);
  const [elapsed, setElapsed] = useState(() =>
    loginTime ? formatElapsedTime(loginTime) : "",
  );

  useEffect(() => {
    if (!loginTime) {
      setElapsed("");
      return;
    }
    setElapsed(formatElapsedTime(loginTime));
    const timer = setInterval(() => {
      setElapsed(formatElapsedTime(loginTime));
    }, 30_000);
    return () => clearInterval(timer);
  }, [loginTime]);

  return (
    <div className="flex items-center justify-between px-4 h-8 border-t border-stroke bg-neutral-bg3/60 shrink-0">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
        <span className="text-[11px] text-neutral-fg3">Connected</span>
      </div>
      <div className="flex items-center gap-3">
        {cliVersion && (
          <span className="text-[10px] text-neutral-fg3 tabular-nums">v{cliVersion}</span>
        )}
        <span className="text-[10px] text-neutral-fg3 tabular-nums">{elapsed}</span>
      </div>
    </div>
  );
}
