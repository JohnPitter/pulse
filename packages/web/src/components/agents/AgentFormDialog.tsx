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
  { value: "haiku", label: "Haiku", description: "Fast & efficient", borderColor: "border-info", bgColor: "bg-info/8", textColor: "text-info" },
  { value: "sonnet", label: "Sonnet", description: "Balanced", borderColor: "border-brand", bgColor: "bg-brand-light", textColor: "text-brand" },
  { value: "opus", label: "Opus", description: "Most capable", borderColor: "border-purple", bgColor: "bg-purple-light", textColor: "text-purple" },
] as const;

const PERMISSION_MODES = [
  { value: "bypassPermissions", label: "Bypass", description: "No confirmations" },
  { value: "acceptEdits", label: "Accept Edits", description: "Auto-accept file changes" },
  { value: "default", label: "Default", description: "Ask for each action" },
  { value: "plan", label: "Plan", description: "Require plan approval" },
] as const;

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

  // Populate form when editing
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
    setName("");
    setProjectPath("");
    setRole("");
    setModel("sonnet");
    setThinkingEnabled(false);
    setPermissionMode("bypassPermissions");
    setClaudeMd("");
    setInitialPrompt("");
    setError(null);
  };

  const handleClose = () => {
    if (!isEditMode) resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectPath.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    if (isEditMode && agent) {
      const payload: UpdateAgentPayload = {
        name: name.trim(),
        role: role.trim() || null,
        model,
        thinkingEnabled,
        permissionMode,
        claudeMd: claudeMd.trim() || null,
        initialPrompt: initialPrompt.trim() || null,
      };
      const updated = await updateAgent(agent.id, payload);
      setIsSubmitting(false);
      if (updated) {
        handleClose();
      } else {
        setError("Failed to update agent. Check the server logs.");
      }
    } else {
      const payload: CreateAgentPayload = {
        name: name.trim(),
        projectPath: projectPath.trim(),
        role: role.trim() || undefined,
        model,
        thinkingEnabled,
        permissionMode,
      };
      if (claudeMd.trim()) payload.claudeMd = claudeMd.trim();
      if (initialPrompt.trim()) payload.initialPrompt = initialPrompt.trim();

      const created = await createAgent(payload);
      setIsSubmitting(false);
      if (created) {
        handleClose();
      } else {
        setError("Failed to create agent. Check the server logs.");
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label={isEditMode ? "Edit agent" : "Create new agent"}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-neutral-bg2 border border-stroke rounded-2xl shadow-16 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stroke">
              <h2 className="text-[18px] font-bold text-neutral-fg1 tracking-tight">
                {isEditMode ? "Edit Agent" : "Create Agent"}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close dialog"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-fg3 hover:bg-neutral-bg3 hover:text-neutral-fg1 transition-all duration-150"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form id="agent-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="agent-name"
                  className="text-[12px] font-medium text-neutral-fg2 mb-1.5 block"
                >
                  Name
                </label>
                <input
                  id="agent-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Agent"
                  required
                  className="input-fluent w-full"
                />
              </div>

              {/* Project Path */}
              <div>
                <label
                  htmlFor="agent-path"
                  className="text-[12px] font-medium text-neutral-fg2 mb-1.5 block"
                >
                  Project Path
                </label>
                <div className="flex gap-2">
                  <input
                    id="agent-path"
                    type="text"
                    value={projectPath}
                    onChange={(e) => setProjectPath(e.target.value)}
                    placeholder="/home/user/project"
                    required
                    readOnly={isEditMode}
                    className={`input-fluent flex-1 ${isEditMode ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="btn-secondary shrink-0 px-3 py-2.5"
                      aria-label="Browse directories"
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

              {/* Role / System Prompt */}
              <div>
                <label
                  htmlFor="agent-role"
                  className="text-[12px] font-medium text-neutral-fg2 mb-1.5 block"
                >
                  Role / System Prompt{" "}
                  <span className="text-neutral-fg-disabled">(optional)</span>
                </label>
                <textarea
                  id="agent-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="You are a helpful assistant focused on..."
                  rows={3}
                  className="input-fluent w-full resize-none"
                />
              </div>

              <div className="border-b border-stroke/50" />

              {/* Model */}
              <fieldset>
                <legend className="text-[11px] font-semibold uppercase tracking-wider text-neutral-fg3 mb-2">
                  Model
                </legend>
                <div className="flex gap-2">
                  {MODELS.map((m) => (
                    <label
                      key={m.value}
                      className={`flex-1 cursor-pointer rounded-xl border px-3 py-3 text-center transition-all duration-200 ${
                        model === m.value
                          ? `border-brand/40 bg-brand-light ${m.textColor}`
                          : "border-stroke bg-neutral-bg3 text-neutral-fg2 hover:border-[var(--card-hover-border)]"
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
                      <span className="block text-[13px] font-bold">{m.label}</span>
                      <span className={`block text-[10px] mt-0.5 ${model === m.value ? "opacity-80" : "text-neutral-fg3"}`}>
                        {m.description}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Thinking toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-bg3 border border-stroke">
                <div>
                  <p className="text-[13px] font-medium text-neutral-fg1">Extended thinking</p>
                  <p className="text-[11px] text-neutral-fg3">Enables deeper reasoning (Sonnet/Opus only)</p>
                </div>
                <label className="relative cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={thinkingEnabled}
                    onChange={(e) => setThinkingEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="h-5 w-9 rounded-full bg-neutral-bg2 border border-stroke transition-colors duration-200 peer-checked:bg-brand peer-checked:border-brand" />
                  <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
                </label>
              </div>

              <div className="border-b border-stroke/50" />

              {/* Permission Mode */}
              <fieldset>
                <legend className="text-[11px] font-semibold uppercase tracking-wider text-neutral-fg3 mb-2">
                  Permission Level
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSION_MODES.map((p) => (
                    <label
                      key={p.value}
                      className={`cursor-pointer rounded-xl border px-3 py-3 transition-all duration-200 ${
                        permissionMode === p.value
                          ? "border-brand/40 bg-brand-light text-brand"
                          : "border-stroke bg-neutral-bg3 text-neutral-fg2 hover:border-[var(--card-hover-border)]"
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
                      <span className="block text-[13px] font-bold">{p.label}</span>
                      <span className={`block text-[10px] mt-0.5 ${permissionMode === p.value ? "opacity-80" : "text-neutral-fg3"}`}>
                        {p.description}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="border-b border-stroke/50" />

              {/* CLAUDE.md */}
              <div>
                <label
                  htmlFor="agent-claudemd"
                  className="text-[12px] font-medium text-neutral-fg2 mb-1.5 block"
                >
                  CLAUDE.md{" "}
                  <span className="text-neutral-fg-disabled">(optional)</span>
                </label>
                <textarea
                  id="agent-claudemd"
                  value={claudeMd}
                  onChange={(e) => setClaudeMd(e.target.value)}
                  placeholder="Custom instructions for this agent..."
                  rows={3}
                  className="input-fluent w-full resize-none"
                />
              </div>

              {/* Initial Prompt */}
              <div>
                <label
                  htmlFor="agent-prompt"
                  className="text-[12px] font-medium text-neutral-fg2 mb-1.5 block"
                >
                  Initial Prompt{" "}
                  <span className="text-neutral-fg-disabled">(optional)</span>
                </label>
                <textarea
                  id="agent-prompt"
                  value={initialPrompt}
                  onChange={(e) => setInitialPrompt(e.target.value)}
                  placeholder="What should the agent work on?"
                  rows={3}
                  className="input-fluent w-full resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-stroke">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary px-4 py-2 text-[14px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="agent-form"
                disabled={isSubmitting || !name.trim() || !projectPath.trim()}
                className="btn-primary px-4 py-2 text-[14px]"
              >
                {isSubmitting ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
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
