import { memo } from "react";
import { motion } from "framer-motion";
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

function formatTime(isoStr: string): string {
  try {
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

const LANGUAGE_REGEX = /language-(\w+)/;

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      {/* Assistant avatar dot */}
      {!isUser && (
        <div className="shrink-0 mr-2 mt-3">
          <span className="inline-flex h-2 w-2 rounded-full bg-orange-500" aria-hidden="true" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-xl px-4 py-3 ${
          isUser
            ? "bg-orange-500/10 border border-orange-500/20 text-orange-100"
            : "border border-white/5 bg-stone-900/80 backdrop-blur-sm text-stone-100 shadow-sm"
        }`}
      >
        <div className="prose-invert text-[14px] leading-relaxed break-words [&_pre]:my-2 [&_pre]:rounded-lg [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = LANGUAGE_REGEX.test(className || "")
                  ? className!.match(LANGUAGE_REGEX)
                  : null;
                const inline = !match;
                return inline ? (
                  <code
                    className="bg-stone-700 px-1 rounded text-sm"
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
        <p
          className={`mt-1 text-[11px] ${
            isUser ? "text-orange-300/50" : "text-stone-600"
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </motion.div>
  );
});
