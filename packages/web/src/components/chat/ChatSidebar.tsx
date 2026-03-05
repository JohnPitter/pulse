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
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stroke shrink-0">
        <MessageSquare className="h-3.5 w-3.5 text-neutral-fg3" />
        <span className="text-[12px] font-semibold text-neutral-fg2 uppercase tracking-wider">Chat</span>
        {messages.length > 0 && (
          <span className="ml-auto text-[11px] text-neutral-fg-disabled">{messages.length} messages</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            <div className="h-10 w-10 rounded-xl bg-neutral-bg3 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-neutral-fg-disabled" />
            </div>
            <p className="text-[12px] text-neutral-fg3">No messages yet.<br />Send one to start.</p>
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
