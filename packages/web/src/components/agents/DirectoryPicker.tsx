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
        className="w-full max-w-lg rounded-xl border border-stone-800 bg-stone-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <FolderSearch className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-white">Browse Directory</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 transition-colors duration-200 hover:bg-stone-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 border-b border-stone-800 px-5 py-2 bg-stone-950 overflow-x-auto scrollbar-none">
          {separator === "\\" ? (
            <button
              onClick={() => {
                if (pathSegments[0]) browse(pathSegments[0] + separator);
              }}
              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium text-stone-400 transition-colors hover:bg-stone-800 hover:text-orange-400"
            >
              {pathSegments[0]}
            </button>
          ) : (
            <button
              onClick={() => browse("/")}
              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium text-stone-400 transition-colors hover:bg-stone-800 hover:text-orange-400"
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
                <ChevronRight className="h-3 w-3 text-stone-600" />
                <button
                  onClick={() => browse(segmentPath)}
                  className="rounded px-1.5 py-0.5 font-mono text-[11px] font-medium text-stone-400 transition-colors hover:bg-stone-800 hover:text-orange-400"
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
              <Loader2 className="h-5 w-5 animate-spin text-stone-500" />
              <span className="text-xs text-stone-500">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-6">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-xs text-red-400 text-center">{error}</span>
              <button
                onClick={() => browse(currentPath)}
                className="mt-1 text-[11px] font-medium text-orange-400 transition-colors hover:text-orange-300"
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
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-stone-800 group"
                >
                  <FolderOpen className="h-4 w-4 text-stone-500 group-hover:text-orange-400 transition-colors" />
                  <span className="text-sm font-medium text-stone-400 group-hover:text-stone-200">..</span>
                </button>
              )}

              {/* Directories */}
              {directories.map((dir) => (
                <button
                  key={dir.path}
                  onClick={() => browse(dir.path)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-stone-800 group"
                >
                  <Folder className="h-4 w-4 text-orange-500/60 group-hover:text-orange-400 transition-colors" />
                  <span className="text-sm text-stone-300 truncate">{dir.name}</span>
                </button>
              ))}

              {/* New folder input */}
              {creatingFolder && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2">
                  <FolderPlus className="h-4 w-4 text-orange-500 shrink-0" />
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
                    className="flex-1 rounded-lg border border-stone-700 bg-stone-950 px-2.5 py-1.5 text-sm text-white placeholder-stone-500 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 focus-visible:ring-offset-stone-900"
                    disabled={creatingInProgress}
                  />
                  <button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim() || creatingInProgress}
                    className="shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-orange-600 disabled:opacity-50"
                  >
                    {creatingInProgress ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create"}
                  </button>
                </div>
              )}

              {/* Empty state */}
              {directories.length === 0 && !parentPath && !creatingFolder && (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Folder className="h-6 w-6 text-stone-700" />
                  <span className="text-xs text-stone-500">No subdirectories</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-800 px-5 py-3.5">
          <button
            onClick={() => {
              setCreatingFolder(true);
              setNewFolderName("");
            }}
            disabled={loading || !!error}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-stone-400 transition-colors hover:bg-stone-800 hover:text-stone-200 disabled:opacity-50"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            New Folder
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-stone-700 bg-stone-950 px-4 py-2 text-sm font-medium text-stone-300 transition-all duration-200 hover:bg-stone-800 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSelect(currentPath);
                onClose();
              }}
              disabled={!currentPath || loading}
              className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
