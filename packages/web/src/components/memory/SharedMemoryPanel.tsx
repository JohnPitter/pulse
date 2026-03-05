import { useState, useEffect } from "react";
import { Save, X, BookOpen } from "lucide-react";

interface SharedMemoryPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SharedMemoryPanel({ open, onClose }: SharedMemoryPanelProps) {
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/memory", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { content: string }) => setContent(data.content))
      .catch(() => {});
  }, [open]);

  const save = async () => {
    setLoading(true);
    try {
      await fetch("/api/memory", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setSaved(true);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col overflow-hidden" style={{ maxHeight: "80vh" }}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stroke shrink-0">
          <BookOpen className="h-4 w-4 text-amber-500" />
          <span className="text-[15px] font-semibold text-neutral-fg1">Shared Memory</span>
          <span className="text-[12px] text-neutral-fg3 ml-1">· visible to all agents</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={save}
              disabled={saved || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-[12px] font-medium transition-colors"
              type="button"
            >
              <Save className="h-3 w-3" />
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-neutral-fg3 hover:text-neutral-fg1 hover:bg-neutral-bg3 transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); setSaved(false); }}
          className="flex-1 resize-none px-5 py-4 text-[13px] font-mono text-neutral-fg1 bg-white focus:outline-none"
          placeholder="Write notes here that all agents will read…"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
