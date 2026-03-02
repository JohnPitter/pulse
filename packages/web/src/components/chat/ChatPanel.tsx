import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { ChatMessage, type ChatMessageData } from "./ChatMessage";

interface ChatPanelProps {
  messages: ChatMessageData[];
}

export function ChatPanel({ messages }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
        <div className="rounded-xl bg-stone-900 p-4 mb-4">
          <MessageSquare className="h-8 w-8 text-stone-600" />
        </div>
        <p className="text-sm font-medium text-stone-400">No messages yet</p>
        <p className="text-xs text-stone-500 mt-1">
          Send a message or start the agent to begin
        </p>
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
