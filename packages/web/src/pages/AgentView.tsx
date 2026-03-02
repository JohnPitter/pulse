import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TerminalSquare,
  MessageSquare,
  Play,
  Square,
  Loader2,
} from "lucide-react";
import { type Agent } from "../stores/agents";
import { AgentStatusBadge } from "../components/agents/AgentStatusBadge";
import { ChatPanel } from "../components/chat/ChatPanel";
import { ChatInput } from "../components/chat/ChatInput";
import { TerminalView } from "../components/terminal/TerminalView";
import { type ChatMessageData } from "../components/chat/ChatMessage";
import { getSocket, emitEvent, onEvent } from "../stores/socket";

function generateMsgId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AgentView() {
  const { id: agentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [ttyMode, setTtyMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);

  // Fetch agent details
  useEffect(() => {
    if (!agentId) return;

    let cancelled = false;

    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${agentId}`, {
          credentials: "include",
        });
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data: Agent = await res.json();
        if (!cancelled) {
          setAgent(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAgent();
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  // Connect socket and subscribe to agent room
  useEffect(() => {
    if (!agentId) return;

    // Ensure socket is connected
    getSocket();

    // Subscribe to agent-specific events
    emitEvent("agent:subscribe", { agentId });

    // Listen for chat messages from the agent
    const unsubMessage = onEvent(
      "agent:message",
      (data: unknown) => {
        const payload = data as {
          agentId: string;
          content: string;
          timestamp: string;
        };
        if (payload.agentId !== agentId) return;
        setMessages((prev) => [
          ...prev,
          {
            id: generateMsgId(),
            role: "assistant",
            content: payload.content,
            timestamp: payload.timestamp,
          },
        ]);
      },
    );

    // Listen for agent questions (waiting state)
    const unsubWaiting = onEvent(
      "agent:waiting",
      (data: unknown) => {
        const payload = data as { agentId: string; content: string };
        if (payload.agentId !== agentId) return;
        setMessages((prev) => [
          ...prev,
          {
            id: generateMsgId(),
            role: "assistant",
            content: payload.content,
            timestamp: new Date().toISOString(),
          },
        ]);
      },
    );

    // Listen for status changes
    const unsubStatus = onEvent(
      "agent:status",
      (data: unknown) => {
        const payload = data as { agentId: string; status: string };
        if (payload.agentId !== agentId) return;
        setAgent((prev) => (prev ? { ...prev, status: payload.status } : prev));
      },
    );

    return () => {
      unsubMessage();
      unsubWaiting();
      unsubStatus();
    };
  }, [agentId]);

  const handleSend = useCallback(
    (content: string) => {
      if (!agentId) return;
      const newMsg: ChatMessageData = {
        id: generateMsgId(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
      emitEvent("chat:send", { agentId, content });
    },
    [agentId],
  );

  const handleStart = useCallback(() => {
    if (!agentId) return;
    emitEvent("agent:start", { agentId });
  }, [agentId]);

  const handleStop = useCallback(() => {
    if (!agentId) return;
    emitEvent("agent:stop", { agentId });
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-950 px-6 text-center">
        <p className="text-sm font-medium text-stone-400">Agent not found</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isRunning = agent.status === "running" || agent.status === "waiting";

  return (
    <div className="flex h-screen flex-col bg-stone-950">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-stone-800 bg-stone-900 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Back to dashboard"
            className="shrink-0 rounded-lg p-1.5 transition-colors duration-200 hover:bg-stone-800"
          >
            <ArrowLeft className="h-5 w-5 text-stone-400" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-white">
              {agent.name}
            </h1>
            <AgentStatusBadge status={agent.status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Start/Stop button */}
          <button
            type="button"
            onClick={isRunning ? handleStop : handleStart}
            aria-label={isRunning ? "Stop agent" : "Start agent"}
            className={`shrink-0 rounded-lg p-2 transition-colors duration-200 ${
              isRunning
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
            }`}
          >
            {isRunning ? (
              <Square className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>

          {/* TTY Toggle */}
          <button
            type="button"
            onClick={() => setTtyMode((prev) => !prev)}
            aria-label={ttyMode ? "Switch to chat" : "Switch to terminal"}
            className={`shrink-0 rounded-lg p-2 transition-colors duration-200 ${
              ttyMode
                ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                : "bg-stone-800 text-stone-400 hover:bg-stone-700"
            }`}
          >
            {ttyMode ? (
              <MessageSquare className="h-4 w-4" />
            ) : (
              <TerminalSquare className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* Content area */}
      {ttyMode ? (
        <TerminalView agentId={agentId!} />
      ) : (
        <>
          <ChatPanel messages={messages} />
          <ChatInput
            onSend={handleSend}
            placeholder={isRunning ? "Type a message..." : "Send a message to start the agent..."}
          />
        </>
      )}
    </div>
  );
}
