import { useState, type FormEvent } from "react";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTasksStore, type CreateTaskPayload } from "../../stores/tasks";
import { useAgentsStore } from "../../stores/agents";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

export function CreateTaskDialog({ open, onClose }: Props) {
  const createTask = useTasksStore((s) => s.createTask);
  const agents = useAgentsStore((s) => s.agents);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [scheduledAt, setScheduledAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [agentId, setAgentId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle(""); setPriority("medium"); setScheduledAt(""); setDueAt(""); setAgentId("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    const payload: CreateTaskPayload = {
      title: title.trim(),
      priority,
      scheduledAt: scheduledAt || undefined,
      dueAt: dueAt || undefined,
      agentId: agentId || undefined,
    };
    const created = await createTask(payload);
    setSubmitting(false);
    if (created) { reset(); onClose(); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18 }}
            className="bg-surface border border-border rounded-2xl shadow-[var(--shadow-modal)] w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-[15px] font-bold text-text-primary">New Task</h2>
              <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-surface-muted text-text-disabled">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title…"
                  required
                  className="input"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <label
                      key={p.value}
                      className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-[12px] font-semibold transition-all ${
                        priority === p.value
                          ? "border-orange/40 bg-orange-light text-orange"
                          : "border-border bg-surface-muted text-text-secondary hover:border-border-strong"
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={p.value}
                        checked={priority === p.value}
                        onChange={() => setPriority(p.value)}
                        className="sr-only"
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Due date</label>
                  <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="input text-[12px]" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Schedule at</label>
                  <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="input text-[12px]" />
                </div>
              </div>

              {agents.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                    Assign agent <span className="text-text-disabled normal-case font-normal tracking-normal">(optional)</span>
                  </label>
                  <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="input text-[13px]">
                    <option value="">No agent</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="btn btn-secondary px-4 py-2">Cancel</button>
                <button type="submit" disabled={submitting || !title.trim()} className="btn btn-primary px-4 py-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Task"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
