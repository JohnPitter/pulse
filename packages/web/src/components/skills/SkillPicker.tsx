import { useState, useEffect, useCallback } from "react";
import { X, Zap } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  description: string;
  type: "tool" | "prompt" | "mcp";
}

interface SkillPickerProps {
  agentId: string;
  open: boolean;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  tool: "Tool",
  prompt: "Prompt",
  mcp: "MCP",
};

const TYPE_COLORS: Record<string, string> = {
  tool: "bg-amber-100 text-amber-700",
  prompt: "bg-blue-100 text-blue-700",
  mcp: "bg-purple-100 text-purple-700",
};

export function SkillPicker({ agentId, open, onClose }: SkillPickerProps) {
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch("/api/skills", { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/skills/agent/${agentId}`, { credentials: "include" }).then((r) => r.json()),
    ]).then(([all, active]: [Skill[], Skill[]]) => {
      setAllSkills(all);
      setActiveIds(new Set(active.map((s) => s.id)));
    }).catch(() => {});
  }, [open, agentId]);

  const toggle = useCallback((id: string) => {
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/skills/agent/${agentId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillIds: [...activeIds] }),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col overflow-hidden" style={{ maxHeight: "75vh" }}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stroke shrink-0">
          <Zap className="h-4 w-4 text-amber-500" />
          <span className="text-[15px] font-semibold text-neutral-fg1">Skills</span>
          <button onClick={onClose} className="ml-auto h-7 w-7 rounded-lg flex items-center justify-center text-neutral-fg3 hover:bg-neutral-bg3 transition-colors" type="button">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {allSkills.length === 0 && (
            <p className="text-[13px] text-neutral-fg3 text-center py-8">No skills defined yet.</p>
          )}
          {allSkills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-stroke hover:bg-neutral-bg3 transition-colors cursor-pointer"
              onClick={() => toggle(skill.id)}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${activeIds.has(skill.id) ? "bg-amber-500 border-amber-500" : "border-stroke"}`}>
                {activeIds.has(skill.id) && <span className="text-white text-[10px] font-bold">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-neutral-fg1">{skill.name}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_COLORS[skill.type] ?? ""}`}>
                    {TYPE_LABELS[skill.type] ?? skill.type}
                  </span>
                </div>
                {skill.description && (
                  <p className="text-[11px] text-neutral-fg3 mt-0.5 truncate">{skill.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-stroke shrink-0">
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-medium transition-colors disabled:opacity-40"
            type="button"
          >
            {saving ? "Saving…" : "Apply Skills"}
          </button>
        </div>
      </div>
    </div>
  );
}
