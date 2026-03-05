import { useEffect, useRef } from "react";
import { CanvasBlock, type Block } from "./CanvasBlock";

interface AgentCanvasProps {
  blocks: Block[];
  isStreaming: boolean;
}

export function AgentCanvas({ blocks, isStreaming }: AgentCanvasProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [blocks]);

  if (blocks.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[13px] text-text-disabled">Send a message to start</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
      {blocks.map((block, i) => (
        <CanvasBlock key={i} block={block} />
      ))}

      {isStreaming && (
        <div className="flex items-center gap-2.5 text-text-disabled text-[12px] py-1">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-orange animate-[pulse-dot_1.2s_ease-in-out_infinite]" />
            <span className="h-1.5 w-1.5 rounded-full bg-orange animate-[pulse-dot_1.2s_ease-in-out_infinite_0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-orange animate-[pulse-dot_1.2s_ease-in-out_infinite_0.4s]" />
          </span>
          <span>Processing…</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
