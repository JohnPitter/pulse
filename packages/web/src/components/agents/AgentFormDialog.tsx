import { useState, useEffect, type FormEvent } from "react";
import { X, Loader2, FolderSearch } from "lucide-react";
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
  { value: "haiku", label: "Haiku" },
  { value: "sonnet", label: "Sonnet" },
  { value: "opus", label: "Opus" },
] as const;

const PERMISSION_MODES = [
  { value: "bypassPermissions", label: "Bypass" },
  { value: "acceptEdits", label: "Accept Edits" },
  { value: "default", label: "Default" },
  { value: "plan", label: "Plan" },
] as const;

export function AgentFormDialog({ open, onClose, agent }: AgentFormDialogProps) {
  const createAgent = useAgentsStore((s) => s.createAgent);
  const updateAgent = useAgentsStore((s) => s.updateAgent);

  const isEditMode = !!agent;

  const [name, setName] = useState("");
  const [projectPath, setProjectPath] = useState("");
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-white/5 bg-stone-900/95 backdrop-blur-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white tracking-tight">
                {isEditMode ? "Edit Agent" : "Create Agent"}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-stone-400 transition-colors duration-200 hover:bg-stone-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="agent-name"
                  className="block text-xs font-medium text-stone-400 mb-1.5"
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
                  className="w-full rounded-xl border border-white/5 bg-stone-800/80 py-2.5 px-3 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
                />
              </div>

              {/* Project Path */}
              <div>
                <label
                  htmlFor="agent-path"
                  className="block text-xs font-medium text-stone-400 mb-1.5"
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
                    className={`flex-1 rounded-xl border border-white/5 bg-stone-800/80 py-2.5 px-3 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${isEditMode ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="shrink-0 rounded-xl border border-white/5 bg-stone-800/80 px-3 py-2.5 text-stone-400 transition-all duration-200 hover:bg-stone-700 hover:text-orange-400 active:scale-[0.98]"
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

              {/* Model */}
              <fieldset>
                <legend className="block text-xs font-medium text-stone-400 mb-2">
                  Model
                </legend>
                <div className="flex gap-2">
                  {MODELS.map((m) => (
                    <label
                      key={m.value}
                      className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition-all duration-200 ${
                        model === m.value
                          ? "border-orange-500 bg-orange-500/10 text-orange-400"
                          : "border-white/5 bg-stone-800/80 text-stone-400 hover:border-white/10"
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
                      {m.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Thinking toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={thinkingEnabled}
                    onChange={(e) => setThinkingEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="h-5 w-9 rounded-full bg-stone-700 transition-colors duration-200 peer-checked:bg-orange-500" />
                  <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 peer-checked:translate-x-4" />
                </div>
                <span className="text-sm text-stone-300">
                  Enable extended thinking
                </span>
              </label>

              {/* Permission Mode */}
              <fieldset>
                <legend className="block text-xs font-medium text-stone-400 mb-2">
                  Permission Level
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSION_MODES.map((p) => (
                    <label
                      key={p.value}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition-all duration-200 ${
                        permissionMode === p.value
                          ? "border-orange-500 bg-orange-500/10 text-orange-400"
                          : "border-white/5 bg-stone-800/80 text-stone-400 hover:border-white/10"
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
                      {p.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* CLAUDE.md */}
              <div>
                <label
                  htmlFor="agent-claudemd"
                  className="block text-xs font-medium text-stone-400 mb-1.5"
                >
                  CLAUDE.md{" "}
                  <span className="text-stone-600">(optional)</span>
                </label>
                <textarea
                  id="agent-claudemd"
                  value={claudeMd}
                  onChange={(e) => setClaudeMd(e.target.value)}
                  placeholder="Custom instructions for this agent..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/5 bg-stone-800/80 py-2.5 px-3 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
                />
              </div>

              {/* Initial Prompt */}
              <div>
                <label
                  htmlFor="agent-prompt"
                  className="block text-xs font-medium text-stone-400 mb-1.5"
                >
                  Initial Prompt{" "}
                  <span className="text-stone-600">(optional)</span>
                </label>
                <textarea
                  id="agent-prompt"
                  value={initialPrompt}
                  onChange={(e) => setInitialPrompt(e.target.value)}
                  placeholder="What should the agent work on?"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/5 bg-stone-800/80 py-2.5 px-3 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-xl border border-white/5 bg-stone-800/80 py-2.5 text-sm font-medium text-stone-300 transition-all duration-200 hover:bg-stone-700 active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !projectPath.trim()}
                  className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {isSubmitting ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : isEditMode ? (
                    "Save"
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
