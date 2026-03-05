import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { ChatMessage } from "./ChatMessage";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

interface ChatSidebarProps {
  messages: Message[];
  streamingContent: string;
}

export function ChatSidebar({ messages, streamingContent }: ChatSidebarProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const isEmpty = messages.length === 0 && !streamingContent;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="module-header shrink-0">
        <MessageSquare className="h-3.5 w-3.5 text-text-disabled" />
        <span className="module-label">Chat</span>
        {messages.length > 0 && (
          <span className="ml-auto text-[11px] text-text-disabled tabular-nums">
            {messages.length}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3 bg-surface">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
            <div className="h-10 w-10 rounded-xl border border-border flex items-center justify-center">
              <MessageSquare className="h-4.5 w-4.5 text-text-disabled" />
            </div>
            <p className="text-[12px] text-text-disabled leading-relaxed">
              No messages yet.<br />Send one to start.
            </p>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                role={m.role}
                content={m.content}
                createdAt={m.createdAt}
              />
            ))}
            {streamingContent && (
              <ChatMessage role="assistant" content={streamingContent} streaming />
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
