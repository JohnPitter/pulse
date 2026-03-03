import { useEffect, useRef } from "react";
import { ChatMessage, type ChatMessageData } from "./ChatMessage";

interface ChatPanelProps {
  messages: ChatMessageData[];
  agentName?: string;
  model?: string;
  projectPath?: string;
}

export function ChatPanel({ messages, agentName, model, projectPath }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="rounded-xl border border-white/5 bg-stone-900/80 px-8 py-8 text-center">
          {/* Claude mascot */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/10">
            <span className="text-2xl text-orange-500" aria-hidden="true">●</span>
          </div>
          <h2 className="text-sm font-semibold tracking-tight text-white">
            {agentName ?? "Claude Code"}
          </h2>
          {model && (
            <span className="mt-1.5 inline-block rounded-full bg-white/5 px-2.5 py-0.5 font-mono text-[10px] font-medium text-white/40">
              {model}
            </span>
          )}
          {projectPath && (
            <p className="mt-2 font-mono text-[12px] text-stone-500 truncate max-w-[300px]">
              {projectPath}
            </p>
          )}
          <p className="mt-3 text-[12px] text-stone-600">
            Send a message or start the agent to begin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
