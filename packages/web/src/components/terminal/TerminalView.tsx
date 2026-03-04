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

    let disposed = false;

    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      theme: {
        background: "#08080A",
        foreground: "#EDEDEF",
        cursor: "#F97316",
        cursorAccent: "#08080A",
        selectionBackground: "rgba(249, 115, 22, 0.3)",
      },
      fontSize: 14,
      fontFamily: 'ui-monospace, SFMono-Regular, "Cascadia Code", monospace',
      lineHeight: 1.2,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(termRef.current);

    const safeFit = () => {
      if (disposed) return;
      try {
        fitAddon.fit();
      } catch {
        // Terminal may be mid-dispose — ignore
      }
    };

    // Delay initial fit to ensure the container has final dimensions after React layout
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        safeFit();
      });
    });

    terminalRef.current = terminal;

    // Subscribe to the agent's socket room (required to receive terminal events)
    emitEvent("agent:subscribe", { agentId });

    // Listen for terminal history replay (tmux capture-pane on reconnect)
    const unsubHistory = onEvent(
      "terminal:history",
      (data: unknown) => {
        const payload = data as { agentId: string; data: string };
        if (payload.agentId === agentId && !disposed) {
          terminal.write(payload.data);
        }
      },
    );

    // Listen for live terminal output from server
    const unsubOutput = onEvent(
      "terminal:output",
      (data: unknown) => {
        const payload = data as { agentId: string; data: string };
        if (payload.agentId === agentId && !disposed) {
          terminal.write(payload.data);
        }
      },
    );

    // Send terminal input to server
    const disposeData = terminal.onData((data: string) => {
      if (!disposed) {
        emitEvent("terminal:input", { agentId, data });
      }
    });

    // Handle resize — notify server of new dimensions
    const observer = new ResizeObserver(() => {
      safeFit();
      if (!disposed) {
        const { cols, rows } = terminal;
        emitEvent("terminal:resize", { agentId, cols, rows });
      }
    });
    observer.observe(termRef.current);

    return () => {
      disposed = true;
      observer.disconnect();
      disposeData.dispose();
      unsubOutput();
      unsubHistory();
      terminal.dispose();
      terminalRef.current = null;
    };
  }, [agentId]);

  return (
    <div className="relative flex-1 min-h-0 min-w-0 overflow-hidden">
      <div
        ref={termRef}
        className="absolute inset-0"
      />
    </div>
  );
}
