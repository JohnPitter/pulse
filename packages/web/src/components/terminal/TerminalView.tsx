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
    let subscribed = false;
    let lastCols = 0;

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
    const unsubHistory = onEvent(
      "terminal:history",
      (data: unknown) => {
        const payload = data as { agentId: string; data: string };
        if (payload.agentId === agentId && !disposed) {
          // Clear screen + cursor home before writing history for a clean render
          terminal.write("\x1b[2J\x1b[H");
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

    /** Subscribe (or re-subscribe) with current terminal dimensions */
    const subscribe = () => {
      if (disposed) return;
      const { cols, rows } = terminal;
      lastCols = cols;
      emitEvent("terminal:resize", { agentId, cols, rows });
      emitEvent("agent:subscribe", { agentId, cols, rows });
      subscribed = true;
    };

    // Handle resize — notify server of new dimensions.
    // When cols change significantly, re-subscribe to get fresh history
    // at the correct dimensions (SIGWINCH makes Claude CLI re-render).
    const observer = new ResizeObserver(() => {
      safeFit();
      if (disposed) return;

      const { cols, rows } = terminal;
      emitEvent("terminal:resize", { agentId, cols, rows });

      // If cols changed significantly after initial subscribe, re-subscribe
      // so the server re-captures tmux after the CLI re-renders at new width.
      if (subscribed && Math.abs(cols - lastCols) > 2) {
        lastCols = cols;
        // Wait for CLI to re-render at new dimensions after SIGWINCH
        setTimeout(() => {
          if (disposed) return;
          emitEvent("agent:subscribe", { agentId, cols, rows });
        }, 300);
      }
    });
    observer.observe(termRef.current);

    // FIT FIRST, then subscribe.
    // Double rAF ensures container has final dimensions after React layout.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (disposed) return;
        safeFit();
        subscribe();
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
