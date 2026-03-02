import { useState, type FormEvent } from "react";
import { X, Loader2, FolderSearch } from "lucide-react";
import { useAgentsStore, type CreateAgentPayload } from "../../stores/agents";
import { DirectoryPicker } from "./DirectoryPicker";

interface CreateAgentDialogProps {
  open: boolean;
  onClose: () => void;
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

export function CreateAgentDialog({ open, onClose }: CreateAgentDialogProps) {
  const createAgent = useAgentsStore((s) => s.createAgent);

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

  if (!open) return null;

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
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectPath.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const payload: CreateAgentPayload = {
      name: name.trim(),
      projectPath: projectPath.trim(),
      model,
      thinkingEnabled,
      permissionMode,
    };
    if (claudeMd.trim()) payload.claudeMd = claudeMd.trim();
    if (initialPrompt.trim()) payload.initialPrompt = initialPrompt.trim();

    const agent = await createAgent(payload);
    setIsSubmitting(false);

    if (agent) {
      handleClose();
    } else {
      setError("Failed to create agent. Check the server logs.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create new agent"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-stone-800 bg-stone-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Create Agent
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
              className="w-full rounded-xl border border-stone-700 bg-stone-950 py-2.5 px-3 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
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
                className="flex-1 rounded-xl border border-stone-700 bg-stone-950 py-2.5 px-3 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
              />
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="shrink-0 rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-stone-400 transition-all duration-200 hover:bg-stone-800 hover:text-orange-400 hover:border-stone-600 active:scale-[0.98]"
                aria-label="Browse directories"
              >
                <FolderSearch className="h-4 w-4" />
              </button>
            </div>
            <DirectoryPicker
              open={pickerOpen}
              onClose={() => setPickerOpen(false)}
              onSelect={(path) => setProjectPath(path)}
              initialPath={projectPath || undefined}
            />
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
                      : "border-stone-700 bg-stone-950 text-stone-400 hover:border-stone-600"
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
                      : "border-stone-700 bg-stone-950 text-stone-400 hover:border-stone-600"
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
              className="w-full resize-none rounded-xl border border-stone-700 bg-stone-950 py-2.5 px-3 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
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
              className="w-full resize-none rounded-xl border border-stone-700 bg-stone-950 py-2.5 px-3 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
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
              className="flex-1 rounded-xl border border-stone-700 bg-stone-950 py-2.5 text-sm font-medium text-stone-300 transition-all duration-200 hover:bg-stone-800 active:scale-[0.98]"
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
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
