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

    terminalRef.current = terminal;

    // Set up socket listeners early — they guard with disposed flag.
    // History and output only arrive AFTER subscribe (deferred below).
    const unsubHistory = onEvent(
      "terminal:history",
      (data: unknown) => {
        const payload = data as { agentId: string; data: string };
        if (payload.agentId === agentId && !disposed) {
          terminal.write(payload.data);
        }
      },
    );

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

    // FIT FIRST, then resize server PTY, then subscribe.
    // This ensures tmux reflows content at correct dimensions before capture.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (disposed) return;
        safeFit();

        const { cols, rows } = terminal;
        emitEvent("terminal:resize", { agentId, cols, rows });

        // Subscribe with dimensions so server can resize tmux pane before capturing history
        emitEvent("agent:subscribe", { agentId, cols, rows });
      });
    });

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
