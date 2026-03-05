import ReactMarkdown from "react-markdown";
import { User, Cpu } from "lucide-react";
import { cn } from "../../lib/cn";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
  streaming?: boolean;
}

export function ChatMessage({ role, content, createdAt, streaming }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
        isUser ? "bg-brand" : "bg-neutral-bg3 border border-stroke"
      )}>
        {isUser
          ? <User className="h-3 w-3 text-white" />
          : <Cpu className="h-3 w-3 text-neutral-fg3" />
        }
      </div>

      {/* Bubble */}
      <div className={cn(
        "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
        isUser
          ? "bg-brand text-white rounded-tr-sm"
          : "bg-white border border-stroke text-neutral-fg1 rounded-tl-sm"
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className={cn(
            "[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
            "[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1.5",
            "[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1.5",
            "[&_li]:my-0.5",
            "[&_pre]:rounded-lg [&_pre]:bg-neutral-bg3 [&_pre]:p-2.5 [&_pre]:text-[11px] [&_pre]:overflow-x-auto [&_pre]:my-2",
            "[&_code]:font-mono [&_code]:text-[11px] [&_code]:bg-neutral-bg3 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
            "[&_h1]:text-[15px] [&_h1]:font-bold [&_h1]:mb-1",
            "[&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:mb-1",
            "[&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:mb-0.5",
            "[&_blockquote]:border-l-2 [&_blockquote]:border-stroke [&_blockquote]:pl-3 [&_blockquote]:text-neutral-fg2 [&_blockquote]:my-1.5",
            "[&_a]:text-brand [&_a]:underline",
            "[&_hr]:border-stroke [&_hr]:my-2",
          )}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}

        {/* Timestamp */}
        {createdAt && !streaming && (
          <p className={cn(
            "text-[10px] mt-1.5 tabular-nums",
            isUser ? "text-white/60 text-right" : "text-neutral-fg-disabled"
          )}>
            {createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

        {/* Streaming indicator */}
        {streaming && (
          <span className="inline-flex gap-0.5 ml-1 mt-0.5 align-middle">
            <span className="h-1 w-1 rounded-full bg-neutral-fg3 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1 w-1 rounded-full bg-neutral-fg3 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1 w-1 rounded-full bg-neutral-fg3 animate-bounce" />
          </span>
        )}
      </div>
    </div>
  );
}
