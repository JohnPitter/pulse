import ReactMarkdown from "react-markdown";
import { User, Cpu } from "lucide-react";
import { cn } from "../../lib/cn";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

export function ChatMessage({ role, content, createdAt }: ChatMessageProps) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        isUser ? "bg-amber-100" : "bg-neutral-bg3"
      )}>
        {isUser
          ? <User className="h-3.5 w-3.5 text-amber-600" />
          : <Cpu className="h-3.5 w-3.5 text-neutral-fg3" />
        }
      </div>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-2.5",
        isUser
          ? "bg-amber-50 border border-amber-200 text-neutral-fg1 text-[13px]"
          : "bg-white border border-stroke text-neutral-fg1"
      )}>
        {isUser
          ? <p className="text-[13px] whitespace-pre-wrap">{content}</p>
          : <div className="text-[13px] leading-relaxed [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_pre]:rounded [&_pre]:bg-neutral-bg3 [&_pre]:p-2 [&_pre]:text-[11px] [&_pre]:overflow-auto [&_code]:font-mono [&_code]:text-[11px] [&_code]:bg-neutral-bg3 [&_code]:px-1 [&_code]:rounded">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
        }
        {createdAt && (
          <p className="text-[10px] text-neutral-fg3 mt-1">
            {createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}
