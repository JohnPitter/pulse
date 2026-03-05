import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronRight, Terminal, Wrench } from "lucide-react";

export type Block =
  | { type: "text"; content: string }
  | { type: "tool_use"; name: string; input: unknown }
  | { type: "tool_result"; name: string; output: string };

export function CanvasBlock({ block }: { block: Block }) {
  const [open, setOpen] = useState(false);

  if (block.type === "text") {
    return (
      <div className="text-[13px] text-neutral-fg1 leading-relaxed [&_p]:my-2 [&_h1]:text-[18px] [&_h1]:font-bold [&_h2]:text-[15px] [&_h2]:font-semibold [&_h3]:text-[13px] [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_pre]:rounded-lg [&_pre]:bg-neutral-fg1 [&_pre]:text-white [&_pre]:p-3 [&_pre]:text-[12px] [&_pre]:overflow-auto [&_code]:font-mono [&_code]:text-[12px] [&_code]:bg-neutral-bg3 [&_code]:px-1 [&_code]:rounded">
        <ReactMarkdown>{block.content}</ReactMarkdown>
      </div>
    );
  }

  if (block.type === "tool_use") {
    return (
      <div className="border border-stroke rounded-xl overflow-hidden bg-white shadow-sm my-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-neutral-bg3 transition-colors"
          type="button"
        >
          {open ? <ChevronDown className="h-3.5 w-3.5 text-neutral-fg3" /> : <ChevronRight className="h-3.5 w-3.5 text-neutral-fg3" />}
          <Wrench className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-[12px] font-medium text-neutral-fg2">{block.name}</span>
        </button>
        {open && (
          <div className="px-4 pb-3 border-t border-stroke">
            <pre className="text-[11px] text-neutral-fg2 overflow-auto mt-2 whitespace-pre-wrap">
              {JSON.stringify(block.input, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // tool_result
  return (
    <div className="border border-stroke rounded-xl overflow-hidden bg-white shadow-sm my-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-neutral-bg3 transition-colors"
        type="button"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 text-neutral-fg3" /> : <ChevronRight className="h-3.5 w-3.5 text-neutral-fg3" />}
        <Terminal className="h-3.5 w-3.5 text-neutral-fg3" />
        <span className="text-[12px] font-medium text-neutral-fg2">Result: {block.name}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-stroke">
          <pre className="text-[11px] text-neutral-fg2 overflow-auto mt-2 whitespace-pre-wrap max-h-48">
            {block.output}
          </pre>
        </div>
      )}
    </div>
  );
}
