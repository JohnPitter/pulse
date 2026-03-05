import { useState, useEffect, type FormEvent } from "react";
import { X, Loader2, FolderSearch, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAgentsStore,
  type Agent,
  type CreateAgentPayload,
  type UpdateAgentPayload,
} from "../../stores/agents";
import { DirectoryPicker } from "./DirectoryPicker";

interface AgentFormDialogProps {
  open: boolean;
  onClose: () => void;
  agent?: Agent | null;
}

const MODELS = [
  { value: "haiku", label: "Haiku", description: "Fast & efficient", accent: "text-blue" },
  { value: "sonnet", label: "Sonnet", description: "Balanced", accent: "text-orange" },
  { value: "opus", label: "Opus", description: "Most capable", accent: "text-purple" },
] as const;

const PERMISSION_MODES = [
  { value: "bypassPermissions", label: "Bypass", description: "No confirmations" },
  { value: "acceptEdits", label: "Accept Edits", description: "Auto-accept file changes" },
  { value: "default", label: "Default", description: "Ask for each action" },
  { value: "plan", label: "Plan", description: "Require plan approval" },
] as const;

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[11px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider"
    >
      {children}
    </label>
  );
}

export function AgentFormDialog({ open, onClose, agent }: AgentFormDialogProps) {
  const createAgent = useAgentsStore((s) => s.createAgent);
  const updateAgent = useAgentsStore((s) => s.updateAgent);

  const isEditMode = !!agent;

  const [name, setName] = useState("");
  const [projectPath, setProjectPath] = useState("");
  const [role, setRole] = useState("");
  const [model, setModel] = useState("sonnet");
  const [thinkingEnabled, setThinkingEnabled] = useState(false);
  const [permissionMode, setPermissionMode] = useState("bypassPermissions");
  const [claudeMd, setClaudeMd] = useState("");
  const [initialPrompt, setInitialPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setProjectPath(agent.projectPath);
      setRole(agent.role ?? "");
      setModel(agent.model);
      setThinkingEnabled(agent.thinkingEnabled === 1);
      setPermissionMode(agent.permissionMode);
      setClaudeMd(agent.claudeMd ?? "");
      setInitialPrompt(agent.initialPrompt ?? "");
      setError(null);
    }
  }, [agent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setName(""); setProjectPath(""); setRole(""); setModel("sonnet");
    setThinkingEnabled(false); setPermissionMode("bypassPermissions");
    setClaudeMd(""); setInitialPrompt(""); setError(null);
  };

  const handleClose = () => {
    if (!isEditMode) resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectPath.trim() || isSubmitting) return;
    setIsSubmitting(true); setError(null);

    if (isEditMode && agent) {
      const payload: UpdateAgentPayload = {
        name: name.trim(), role: role.trim() || null, model, thinkingEnabled,
        permissionMode, claudeMd: claudeMd.trim() || null, initialPrompt: initialPrompt.trim() || null,
      };
      const updated = await updateAgent(agent.id, payload);
      setIsSubmitting(false);
      if (updated) handleClose();
      else setError("Failed to update agent. Check the server logs.");
    } else {
      const payload: CreateAgentPayload = {
        name: name.trim(), projectPath: projectPath.trim(), role: role.trim() || undefined,
        model, thinkingEnabled, permissionMode,
      };
      if (claudeMd.trim()) payload.claudeMd = claudeMd.trim();
      if (initialPrompt.trim()) payload.initialPrompt = initialPrompt.trim();

      const created = await createAgent(payload);
      setIsSubmitting(false);
      if (created) handleClose();
      else setError("Failed to create agent. Check the server logs.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label={isEditMode ? "Edit agent" : "Create agent"}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18 }}
            className="bg-surface border border-border rounded-2xl shadow-[var(--shadow-modal)] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-[16px] font-bold text-text-primary tracking-tight">
                {isEditMode ? "Edit Agent" : "Create Agent"}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-disabled hover:bg-surface-muted hover:text-text-primary transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form id="agent-form" onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
              {/* Name */}
              <div>
                <FieldLabel htmlFor="agent-name">Name</FieldLabel>
                <input
                  id="agent-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Agent"
                  required
                  className="input"
                />
              </div>

              {/* Project Path */}
              <div>
                <FieldLabel htmlFor="agent-path">Project Path</FieldLabel>
                <div className="flex gap-2">
                  <input
                    id="agent-path"
                    type="text"
                    value={projectPath}
                    onChange={(e) => setProjectPath(e.target.value)}
                    placeholder="/home/user/project"
                    required
                    readOnly={isEditMode}
                    className={`input flex-1 ${isEditMode ? "opacity-55 cursor-not-allowed" : ""}`}
                  />
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="btn btn-secondary shrink-0 px-3"
                      aria-label="Browse"
                    >
                      <FolderSearch className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {!isEditMode && (
                  <DirectoryPicker
                    open={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                    onSelect={(path) => setProjectPath(path)}
                    initialPath={projectPath || undefined}
                  />
                )}
              </div>

              {/* Role */}
              <div>
                <FieldLabel htmlFor="agent-role">
                  Role / System Prompt{" "}
                  <span className="text-text-disabled normal-case font-normal tracking-normal">(optional)</span>
                </FieldLabel>
                <textarea
                  id="agent-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="You are a helpful assistant focused on…"
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div className="h-px bg-border" />

              {/* Model */}
              <fieldset>
                <legend className="text-[11px] font-semibold uppercase tracking-wider text-text-disabled mb-2">
                  Model
                </legend>
                <div className="flex gap-2">
                  {MODELS.map((m) => (
                    <label
                      key={m.value}
                      className={`flex-1 cursor-pointer rounded-xl border px-3 py-3 text-center transition-all ${
                        model === m.value
                          ? "border-orange/40 bg-orange-light"
                          : "border-border bg-surface-muted hover:border-border-strong"
                      }`}
                    >
                      <input
                        type="radio"
                        name="model"
                        value={m.value}
                        checked={model === m.value}
                        onChange={() => setModel(m.value)}
                        className="sr-only"
                      />
                      <span className={`block text-[13px] font-bold ${model === m.value ? m.accent : "text-text-primary"}`}>
                        {m.label}
                      </span>
                      <span className="block text-[10px] mt-0.5 text-text-disabled">
                        {m.description}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Thinking toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-muted border border-border">
                <div>
                  <p className="text-[13px] font-semibold text-text-primary">Extended thinking</p>
                  <p className="text-[11px] text-text-disabled">Deeper reasoning (Sonnet/Opus only)</p>
                </div>
                <label className="relative cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={thinkingEnabled}
                    onChange={(e) => setThinkingEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`toggle-track ${thinkingEnabled ? "active" : ""}`}>
                    <div className="toggle-thumb" />
                  </div>
                </label>
              </div>

              <div className="h-px bg-border" />

              {/* Permission */}
              <fieldset>
                <legend className="text-[11px] font-semibold uppercase tracking-wider text-text-disabled mb-2">
                  Permission Level
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSION_MODES.map((p) => (
                    <label
                      key={p.value}
                      className={`cursor-pointer rounded-xl border px-3 py-3 transition-all ${
                        permissionMode === p.value
                          ? "border-orange/40 bg-orange-light"
                          : "border-border bg-surface-muted hover:border-border-strong"
                      }`}
                    >
                      <input
                        type="radio"
                        name="permission"
                        value={p.value}
                        checked={permissionMode === p.value}
                        onChange={() => setPermissionMode(p.value)}
                        className="sr-only"
                      />
                      <span className={`block text-[12px] font-bold ${permissionMode === p.value ? "text-orange" : "text-text-primary"}`}>
                        {p.label}
                      </span>
                      <span className="block text-[10px] mt-0.5 text-text-disabled">{p.description}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="h-px bg-border" />

              {/* CLAUDE.md */}
              <div>
                <FieldLabel htmlFor="agent-claudemd">
                  CLAUDE.md{" "}
                  <span className="text-text-disabled normal-case font-normal tracking-normal">(optional)</span>
                </FieldLabel>
                <textarea
                  id="agent-claudemd"
                  value={claudeMd}
                  onChange={(e) => setClaudeMd(e.target.value)}
                  placeholder="Custom instructions for this agent…"
                  rows={3}
                  className="input resize-none"
                />
              </div>

              {/* Initial Prompt */}
              <div>
                <FieldLabel htmlFor="agent-prompt">
                  Initial Prompt{" "}
                  <span className="text-text-disabled normal-case font-normal tracking-normal">(optional)</span>
                </FieldLabel>
                <textarea
                  id="agent-prompt"
                  value={initialPrompt}
                  onChange={(e) => setInitialPrompt(e.target.value)}
                  placeholder="What should the agent work on?"
                  rows={3}
                  className="input resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger-light px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
                  <p className="text-[13px] text-danger">{error}</p>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <button type="button" onClick={handleClose} className="btn btn-secondary px-4 py-2">
                Cancel
              </button>
              <button
                type="submit"
                form="agent-form"
                disabled={isSubmitting || !name.trim() || !projectPath.trim()}
                className="btn btn-primary px-4 py-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEditMode ? (
                  "Save Changes"
                ) : (
                  "Create Agent"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
