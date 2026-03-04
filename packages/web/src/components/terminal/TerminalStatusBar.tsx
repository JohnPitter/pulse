import { useState, useEffect } from "react";
import { Clock, Wifi } from "lucide-react";
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
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5">
          <Wifi className="h-3 w-3 text-success" />
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
        </span>
        <span className="text-[11px] font-mono text-neutral-fg3">
          {cliVersion ? `Claude CLI ${cliVersion}` : "CLI version loading..."}
        </span>
      </div>
      <span className="flex items-center gap-1 text-[11px] font-mono text-neutral-fg3 tabular-nums">
        <Clock className="h-3 w-3" />
        {elapsed ? `${elapsed}` : "pulse"}
      </span>
    </div>
  );
}
