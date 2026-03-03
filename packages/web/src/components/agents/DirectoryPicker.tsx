import { useState, useEffect, useCallback, useRef } from "react";
import {
  Folder,
  FolderOpen,
  FolderPlus,
  FolderSearch,
  ChevronRight,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface DirectoryPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  initialPath?: string;
}

interface BrowseResponse {
  currentPath: string;
  parentPath: string | null;
  separator: string;
  directories: { name: string; path: string }[];
}

export function DirectoryPicker({ open, onClose, onSelect, initialPath }: DirectoryPickerProps) {
  const [currentPath, setCurrentPath] = useState("");
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [separator, setSeparator] = useState("/");
  const [directories, setDirectories] = useState<{ name: string; path: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingInProgress, setCreatingInProgress] = useState(false);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  const browse = useCallback(async (path?: string) => {
    setLoading(true);
    setError("");
    try {
      const query = path ? `?path=${encodeURIComponent(path)}` : "";
      const res = await fetch(`/api/filesystem/browse${query}`, { credentials: "include" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to browse");
      }
      const data = (await res.json()) as BrowseResponse;
      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
      setSeparator(data.separator);
      setDirectories(data.directories);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to browse directory";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      browse(initialPath || undefined);
      setCreatingFolder(false);
      setNewFolderName("");
    }
  }, [open, initialPath, browse]);

  useEffect(() => {
    if (creatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [creatingFolder]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleCreateFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    setCreatingInProgress(true);
    try {
      const fullPath = currentPath + separator + trimmed;
      const res = await fetch("/api/filesystem/mkdir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ path: fullPath }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create folder");
      }
      setCreatingFolder(false);
      setNewFolderName("");
      await browse(currentPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create folder";
      setError(msg);
    } finally {
      setCreatingInProgress(false);
    }
  };

  const pathSegments = currentPath ? currentPath.split(separator).filter(Boolean) : [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-stroke bg-neutral-bg2 shadow-16 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <FolderSearch className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-semibold text-neutral-fg1">Browse Directory</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-fg2 transition-colors duration-200 hover:bg-neutral-bg3 hover:text-neutral-fg1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 border-b border-stroke px-5 py-2 bg-neutral-bg1 overflow-x-auto scrollbar-none">
          {separator === "\\" ? (
            <button
              onClick={() => {
                if (pathSegments[0]) browse(pathSegments[0] + separator);
              }}
              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium text-neutral-fg2 transition-colors hover:bg-neutral-bg3 hover:text-brand"
            >
              {pathSegments[0]}
            </button>
          ) : (
            <button
              onClick={() => browse("/")}
              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium text-neutral-fg2 transition-colors hover:bg-neutral-bg3 hover:text-brand"
            >
              /
            </button>
          )}
          {pathSegments.slice(separator === "\\" ? 1 : 0).map((segment, idx) => {
            const offset = separator === "\\" ? 1 : 0;
            const segmentPath =
              separator === "\\"
                ? pathSegments.slice(0, idx + offset + 1).join(separator)
                : separator + pathSegments.slice(0, idx + 1).join(separator);
            return (
              <div key={segmentPath} className="flex items-center gap-1 shrink-0">
                <ChevronRight className="h-3 w-3 text-neutral-fg-disabled" />
                <button
                  onClick={() => browse(segmentPath)}
                  className="rounded px-1.5 py-0.5 font-mono text-[11px] font-medium text-neutral-fg2 transition-colors hover:bg-neutral-bg3 hover:text-brand"
                >
                  {segment}
                </button>
              </div>
            );
          })}
        </div>

        {/* Directory list */}
        <div className="h-[300px] overflow-y-auto px-2 py-1.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-fg3" />
              <span className="text-xs text-neutral-fg3">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-6">
              <AlertCircle className="h-5 w-5 text-danger" />
              <span className="text-xs text-danger text-center">{error}</span>
              <button
                onClick={() => browse(currentPath)}
                className="mt-1 text-[11px] font-medium text-brand transition-colors hover:text-brand-hover"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Parent directory */}
              {parentPath && (
                <button
                  onClick={() => browse(parentPath)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-neutral-bg-hover group"
                >
                  <FolderOpen className="h-4 w-4 text-neutral-fg3 group-hover:text-brand transition-colors" />
                  <span className="text-sm font-medium text-neutral-fg2 group-hover:text-neutral-fg1">..</span>
                </button>
              )}

              {/* Directories */}
              {directories.map((dir) => (
                <button
                  key={dir.path}
                  onClick={() => browse(dir.path)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-neutral-bg-hover group"
                >
                  <Folder className="h-4 w-4 text-brand/60 group-hover:text-brand transition-colors" />
                  <span className="text-sm text-neutral-fg2 truncate">{dir.name}</span>
                </button>
              ))}

              {/* New folder input */}
              {creatingFolder && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2">
                  <FolderPlus className="h-4 w-4 text-brand shrink-0" />
                  <input
                    ref={newFolderInputRef}
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFolder();
                      if (e.key === "Escape") {
                        setCreatingFolder(false);
                        setNewFolderName("");
                      }
                    }}
                    placeholder="Folder name..."
                    className="input-fluent flex-1 py-1.5 px-2.5 text-sm"
                    disabled={creatingInProgress}
                  />
                  <button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim() || creatingInProgress}
                    className="btn-primary shrink-0 px-3 py-1.5 text-xs"
                  >
                    {creatingInProgress ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create"}
                  </button>
                </div>
              )}

              {/* Empty state */}
              {directories.length === 0 && !parentPath && !creatingFolder && (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Folder className="h-6 w-6 text-neutral-fg-disabled" />
                  <span className="text-xs text-neutral-fg3">No subdirectories</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stroke px-5 py-3.5">
          <button
            onClick={() => {
              setCreatingFolder(true);
              setNewFolderName("");
            }}
            disabled={loading || !!error}
            className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs font-medium disabled:opacity-50"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            New Folder
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSelect(currentPath);
                onClose();
              }}
              disabled={!currentPath || loading}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
