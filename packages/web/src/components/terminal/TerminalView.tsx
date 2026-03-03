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
      cursorStyle: "bar",
      theme: {
        background: "#0c0a09",
        foreground: "#e7e5e4",
        cursor: "#f97316",
        cursorAccent: "#0c0a09",
        selectionBackground: "rgba(249, 115, 22, 0.3)",
      },
      fontSize: 14,
      fontFamily: '"Geist Mono", ui-monospace, SFMono-Regular, monospace',
      lineHeight: 1.2,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(termRef.current);
    fitAddon.fit();

    terminalRef.current = terminal;

    // Subscribe to the agent's socket room (required to receive terminal events)
    emitEvent("agent:subscribe", { agentId });

    // Listen for terminal history replay (tmux capture-pane on reconnect)
    const unsubHistory = onEvent(
      "terminal:history",
      (data: unknown) => {
        const payload = data as { agentId: string; data: string };
        if (payload.agentId === agentId) {
          terminal.write(payload.data);
        }
      },
    );

    // Listen for live terminal output from server
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

    // Handle resize — notify server of new dimensions
    const observer = new ResizeObserver(() => {
      fitAddon.fit();
      const { cols, rows } = terminal;
      emitEvent("terminal:resize", { agentId, cols, rows });
    });
    observer.observe(termRef.current);

    return () => {
      observer.disconnect();
      disposeData.dispose();
      unsubOutput();
      unsubHistory();
      terminal.dispose();
      terminalRef.current = null;
    };
  }, [agentId]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        ref={termRef}
        className="flex-1 w-full min-h-0"
      />
    </div>
  );
}
