import { useEffect, useRef } from "react";
import { CanvasBlock, type Block } from "./CanvasBlock";
import { Loader2 } from "lucide-react";

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
      <div className="flex-1 flex items-center justify-center text-neutral-fg3 text-[13px]">
        Send a message to start
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
      {blocks.map((block, i) => (
        <CanvasBlock key={i} block={block} />
      ))}
      {isStreaming && (
        <div className="flex items-center gap-2 text-neutral-fg3 text-[12px]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Thinking…</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
