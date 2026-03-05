import ReactMarkdown from "react-markdown";
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
    <div className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Role indicator */}
      <div className={cn(
        "h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold",
        isUser
          ? "bg-orange text-white"
          : "bg-surface-muted border border-border text-text-disabled"
      )}>
        {isUser ? "U" : "A"}
      </div>

      {/* Bubble */}
      <div className={cn(
        "max-w-[84%] rounded-xl px-3 py-2.5 text-[13px] leading-relaxed",
        isUser
          ? "bg-orange text-white rounded-tr-sm"
          : "bg-surface border border-border text-text-primary rounded-tl-sm"
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className={cn(
            "[&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
            "[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1.5",
            "[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1.5",
            "[&_li]:my-0.5",
            "[&_pre]:rounded-lg [&_pre]:bg-[#111827] [&_pre]:text-[#E5E7EB] [&_pre]:p-2.5 [&_pre]:text-[11px] [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre]:font-mono",
            "[&_code]:font-mono [&_code]:text-[11px] [&_code]:bg-surface-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
            "[&_h1]:text-[15px] [&_h1]:font-bold [&_h1]:mb-1",
            "[&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:mb-1",
            "[&_h3]:text-[13px] [&_h3]:font-semibold",
            "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-text-secondary [&_blockquote]:my-1.5",
            "[&_a]:text-blue [&_a]:underline",
          )}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}

        {createdAt && !streaming && (
          <p className={cn(
            "text-[10px] mt-1.5 tabular-nums",
            isUser ? "text-white/60 text-right" : "text-text-disabled"
          )}>
            {createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

        {streaming && (
          <span className="inline-flex gap-0.5 ml-1 mt-0.5 align-middle">
            <span className="h-1 w-1 rounded-full bg-text-disabled animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1 w-1 rounded-full bg-text-disabled animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1 w-1 rounded-full bg-text-disabled animate-bounce" />
          </span>
        )}
      </div>
    </div>
  );
}
