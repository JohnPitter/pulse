interface TerminalStatusBarProps {
  cliVersion: string | null;
}

export function TerminalStatusBar({ cliVersion }: TerminalStatusBarProps) {
  return (
    <div className="flex h-8 items-center justify-between border-t border-white/5 bg-stone-900/60 px-4">
      <span className="text-[11px] font-mono text-stone-600">
        {cliVersion ? `Claude CLI ${cliVersion}` : "CLI version loading..."}
      </span>
      <span className="text-[11px] font-semibold tracking-wider text-stone-700">
        pulse
      </span>
    </div>
  );
}
