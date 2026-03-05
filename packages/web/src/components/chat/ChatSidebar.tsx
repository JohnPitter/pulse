import { useEffect, useRef } from "react";
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

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((m) => (
        <ChatMessage
          key={m.id}
          role={m.role}
          content={m.content}
          createdAt={m.createdAt}
        />
      ))}
      {streamingContent && (
        <ChatMessage role="assistant" content={streamingContent} />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
