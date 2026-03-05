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
      <div className="text-[13.5px] text-text-primary leading-relaxed
        [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0
        [&_h1]:text-[17px] [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:tracking-tight
        [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:mb-1.5
        [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:mb-1
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
        [&_li]:my-1
        [&_pre]:rounded-lg [&_pre]:bg-[#111827] [&_pre]:text-[#E5E7EB] [&_pre]:p-3.5 [&_pre]:text-[12px] [&_pre]:overflow-auto [&_pre]:my-3 [&_pre]:font-mono
        [&_code]:font-mono [&_code]:text-[12px] [&_code]:bg-surface-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:border [&_code]:border-border
        [&_blockquote]:border-l-2 [&_blockquote]:border-orange [&_blockquote]:pl-3 [&_blockquote]:text-text-secondary [&_blockquote]:my-2
        [&_a]:text-blue [&_a]:underline
        [&_hr]:border-border [&_hr]:my-3
        [&_strong]:font-semibold [&_em]:italic
      ">
        <ReactMarkdown>{block.content}</ReactMarkdown>
      </div>
    );
  }

  if (block.type === "tool_use") {
    return (
      <div className="tool-block animate-fade-in">
        <button
          onClick={() => setOpen((o) => !o)}
          className="tool-block-header w-full text-left"
          type="button"
        >
          <span className="text-text-disabled">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
          <Wrench className="h-3.5 w-3.5 text-orange" />
          <span className="text-[12px] font-semibold text-text-secondary">{block.name}</span>
          <span className="ml-auto text-[10px] font-mono text-text-disabled uppercase tracking-wider">
            call
          </span>
        </button>
        {open && (
          <div className="px-4 pb-3 pt-0.5 border-t border-border bg-surface-muted">
            <pre className="text-[11px] text-text-secondary overflow-auto mt-2.5 font-mono whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(block.input, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // tool_result
  return (
    <div className="tool-block animate-fade-in">
      <button
        onClick={() => setOpen((o) => !o)}
        className="tool-block-header w-full text-left"
        type="button"
      >
        <span className="text-text-disabled">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
        <Terminal className="h-3.5 w-3.5 text-blue" />
        <span className="text-[12px] font-semibold text-text-secondary">{block.name}</span>
        <span className="ml-auto text-[10px] font-mono text-text-disabled uppercase tracking-wider">
          result
        </span>
      </button>
      {open && (
        <div className="px-4 pb-3 pt-0.5 border-t border-border">
          <pre className="text-[11px] text-text-secondary overflow-auto mt-2.5 font-mono whitespace-pre-wrap leading-relaxed max-h-56">
            {block.output}
          </pre>
        </div>
      )}
    </div>
  );
}
