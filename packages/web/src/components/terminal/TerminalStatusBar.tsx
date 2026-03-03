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
    <div className="flex h-8 items-center justify-between border-t border-stroke bg-neutral-bg2 px-4">
      <span className="text-[11px] font-mono text-neutral-fg3">
        {cliVersion ? `Claude CLI ${cliVersion}` : "CLI version loading..."}
      </span>
      <span className="text-[11px] font-mono text-neutral-fg3 tabular-nums">
        {elapsed ? `Logged in ${elapsed}` : "pulse"}
      </span>
    </div>
  );
}
