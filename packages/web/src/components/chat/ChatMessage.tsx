import { memo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatMessageProps {
  message: ChatMessageData;
}

const LANGUAGE_REGEX = /language-(\w+)/;

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="mb-3 flex items-start gap-2">
        <span className="mt-2 shrink-0 font-mono text-sm text-white/40" aria-hidden="true">
          ❯
        </span>
        <div className="rounded-lg border border-white/10 bg-stone-800/60 px-3 py-2">
          <p className="text-[14px] leading-relaxed text-stone-200 break-words">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-start gap-2.5">
      <span className="mt-1 shrink-0 text-orange-500 text-lg leading-none" aria-hidden="true">
        ●
      </span>
      <div className="min-w-0 flex-1 prose-invert text-[14px] leading-relaxed text-stone-200 break-words [&_pre]:my-2 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-white/5 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
        <ReactMarkdown
          components={{
            code({ className, children, ...props }) {
              const match = LANGUAGE_REGEX.test(className || "")
                ? className!.match(LANGUAGE_REGEX)
                : null;
              const inline = !match;
              return inline ? (
                <code
                  className="bg-stone-700/80 px-1.5 py-0.5 rounded text-[13px]"
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
});
