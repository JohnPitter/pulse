import { useRef, useState, useCallback } from "react";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder = "Type a message..." }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const hasContent = value.trim().length > 0;

  return (
    <div className="border-t border-white/5 bg-stone-900/90 backdrop-blur-sm px-4 py-3">
      <div className="flex items-end gap-3">
        <span className="mb-2.5 shrink-0 font-mono text-sm text-white/30" aria-hidden="true">
          ❯
        </span>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none bg-transparent text-[14px] text-white placeholder-stone-500 outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !hasContent}
          aria-label="Send message"
          className={`mb-1 shrink-0 px-2 py-1 text-[13px] font-medium transition-colors duration-200 ${
            hasContent
              ? "text-orange-400 hover:text-orange-300"
              : "text-stone-600"
          } disabled:opacity-40`}
        >
          send
        </button>
      </div>
    </div>
  );
}
