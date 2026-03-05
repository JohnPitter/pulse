import { useEffect, useState } from "react";
import { Plus, FolderKanban } from "lucide-react";

interface Project { id: string; name: string; description: string | null; color: string; createdAt: string; }

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/projects", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data: Project[]) => setProjects(data))
      .catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const res = await fetch("/api/projects", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      const p = await res.json() as Project;
      setProjects((prev) => [p, ...prev]);
      setName(""); setCreating(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-text-secondary">{projects.length} projects</p>
        <button type="button" onClick={() => setCreating(true)} className="btn btn-primary px-4 py-2 text-[13px]">
          <Plus className="h-3.5 w-3.5" /> New Project
        </button>
      </div>

      {creating && (
        <div className="bg-surface border border-border rounded-2xl p-4 mb-3 flex items-center gap-3 shadow-[var(--shadow-card)]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name…"
            className="input flex-1"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button type="button" onClick={handleCreate} className="btn btn-primary px-4 py-2">Create</button>
          <button type="button" onClick={() => setCreating(false)} className="btn btn-secondary px-3 py-2">Cancel</button>
        </div>
      )}

      {projects.length === 0 && !creating ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <FolderKanban className="h-10 w-10 text-text-disabled" />
          <p className="text-[14px] font-semibold text-text-primary">No projects yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p) => (
            <div key={p.id} className="bg-surface border border-border/50 rounded-2xl p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ background: p.color }} />
                <p className="text-[14px] font-semibold text-text-primary">{p.name}</p>
              </div>
              {p.description && <p className="text-[12px] text-text-secondary">{p.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
