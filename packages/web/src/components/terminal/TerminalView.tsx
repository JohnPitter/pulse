import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { onEvent, emitEvent } from "../../stores/socket";

interface TerminalViewProps {
  agentId: string;
}

export function TerminalView({ agentId }: TerminalViewProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!termRef.current) return;

    const terminal = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#0c0a09", // stone-950
        foreground: "#e7e5e4", // stone-200
      },
      fontSize: 14,
      fontFamily: "monospace",
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(termRef.current);
    fitAddon.fit();

    terminalRef.current = terminal;

    // Listen for terminal output from server
    const unsubOutput = onEvent(
      "terminal:output",
      (data: unknown) => {
        const payload = data as { agentId: string; data: string };
        if (payload.agentId === agentId) {
          terminal.write(payload.data);
        }
      },
    );

    // Send terminal input to server
    const disposeData = terminal.onData((data: string) => {
      emitEvent("terminal:input", { agentId, data });
    });

    // Handle resize
    const observer = new ResizeObserver(() => {
      fitAddon.fit();
    });
    observer.observe(termRef.current);

    return () => {
      observer.disconnect();
      disposeData.dispose();
      unsubOutput();
      terminal.dispose();
      terminalRef.current = null;
    };
  }, [agentId]);

  return (
    <div
      ref={termRef}
      className="flex-1 w-full min-h-0"
    />
  );
}
