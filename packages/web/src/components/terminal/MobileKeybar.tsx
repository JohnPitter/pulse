import { emitEvent } from "../../stores/socket";

interface MobileKeybarProps {
  agentId: string;
}

interface KeyAction {
  label: string;
  key: string;
}

const KEYS: KeyAction[] = [
  { label: "Tab", key: "\t" },
  { label: "\u2191", key: "\x1b[A" },
  { label: "\u2193", key: "\x1b[B" },
  { label: "\u2190", key: "\x1b[D" },
  { label: "\u2192", key: "\x1b[C" },
  { label: "^C", key: "\x03" },
  { label: "^D", key: "\x04" },
  { label: "Esc", key: "\x1b" },
  { label: "Home", key: "\x1b[H" },
  { label: "End", key: "\x1b[F" },
];

export function MobileKeybar({ agentId }: MobileKeybarProps) {
  const sendKey = (key: string) => {
    emitEvent("terminal:input", { agentId, data: key });
  };

  return (
    <div className="flex gap-1.5 overflow-x-auto px-3 py-2 border-t border-white/5 bg-stone-900/90 backdrop-blur-sm sm:hidden">
      {KEYS.map((k) => (
        <button
          key={k.label}
          type="button"
          onClick={() => sendKey(k.key)}
          className="shrink-0 rounded-md border border-white/10 bg-stone-800/80 px-2.5 py-1.5 text-[11px] font-mono text-stone-300 transition-all duration-150 hover:bg-stone-700 active:scale-[0.95]"
        >
          {k.label}
        </button>
      ))}
    </div>
  );
}
