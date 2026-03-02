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

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`max-w-[85%] rounded-xl px-4 py-3 ${
          isUser
            ? "bg-orange-500/10 text-orange-100"
            : "bg-stone-800 text-stone-100 shadow-sm"
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
            isUser ? "text-orange-300/50" : "text-stone-500"
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
