import { useEffect, useMemo, useState } from "react";
import { Filter, FolderOpen, Layers3 } from "lucide-react";
import { useProjectsStore } from "../../stores/projects";
import { useShellQuery } from "./useShellQuery";
import { useI18n } from "../../i18n";

const CARD_CLASS =
  "rounded-[20px] border border-black/6 bg-[#F1EFEC] shadow-[0_8px_18px_rgba(0,0,0,0.06)]";

interface BrowseEntry {
  name: string;
  path: string;
}

export function FilesPage() {
  const query = useShellQuery();
  const { t } = useI18n();

  const projects = useProjectsStore((s) => s.projects);
  const fetchProjects = useProjectsStore((s) => s.fetchProjects);

  const [currentPath, setCurrentPath] = useState("");
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [directories, setDirectories] = useState<BrowseEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const browsePath = async (path?: string) => {
    setLoading(true);
    try {
      const url = path ? `/api/filesystem/browse?path=${encodeURIComponent(path)}` : "/api/filesystem/browse";
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { currentPath: string; parentPath: string | null; directories: BrowseEntry[] };
        setCurrentPath(data.currentPath);
        setParentPath(data.parentPath);
        setDirectories(data.directories);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    browsePath();
  }, []);

  const filteredDirs = useMemo(
    () =>
      directories.filter((dir) => {
        return !query || dir.name.toLowerCase().includes(query);
      }),
    [directories, query],
  );

  return (
    <div className="grid h-full min-h-[520px] grid-cols-1 gap-3 xl:grid-cols-[0.66fr_0.34fr] animate-fade-in">
      <section className={`${CARD_CLASS} min-h-0 p-4 animate-fade-up stagger-1`}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-neutral-fg1">{t("routes.files")}</h2>
            <p className="text-[12px] text-neutral-fg2">{t("filesPage.fileGridFilters")}</p>
          </div>
          <Filter className="h-4 w-4 text-neutral-fg3" />
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-xl border border-stroke bg-neutral-bg2 px-3 py-1.5">
          <FolderOpen className="h-4 w-4 text-neutral-fg3" />
          <p className="truncate text-[12px] text-neutral-fg1">{currentPath || "..."}</p>
          {parentPath && (
            <button
              type="button"
              onClick={() => browsePath(parentPath)}
              className="ml-auto shrink-0 rounded-lg border border-stroke bg-neutral-bg3 px-2 py-0.5 text-[10px] text-neutral-fg2 hover:bg-neutral-bg2"
            >
              {t("filesPage.goUp")}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : filteredDirs.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filteredDirs.map((dir) => (
              <button
                key={dir.path}
                type="button"
                onClick={() => browsePath(dir.path)}
                className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3 text-left hover:border-stroke transition-colors"
              >
                <div className="mb-3 flex h-[72px] items-center justify-center rounded-xl border border-black/5 bg-[linear-gradient(180deg,#EEEAE5,#E2DFD9)]">
                  <FolderOpen className="h-7 w-7 text-neutral-fg3" />
                </div>
                <p className="truncate text-[12px] font-semibold text-neutral-fg1">{dir.name}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-stroke bg-neutral-bg2/70">
            <p className="text-[12px] text-neutral-fg3">{t("filesPage.noFileMatch")}</p>
          </div>
        )}
      </section>

      <section className={`${CARD_CLASS} flex min-h-0 flex-col p-4 animate-fade-up stagger-2`}>
        <div className="mb-3 flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-neutral-fg3" />
          <div>
            <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-neutral-fg1">{t("filesPage.previewPanel")}</h3>
            <p className="text-[12px] text-neutral-fg2">{t("filesPage.previewPanelSubtitle")}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
            <p className="text-[10px] uppercase tracking-wide text-neutral-fg3">{t("projectsPage.project")}</p>
            <div className="mt-1 space-y-1">
              {projects.length > 0 ? (
                projects.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <p className="text-[12px] text-neutral-fg1">{p.name}</p>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-neutral-fg3">{t("projectsPage.noMatch")}</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
